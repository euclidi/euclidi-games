#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <bgfx/bgfx.h>
#include <iostream>
#include <string_view>
#include <algorithm>
#include <vector>
#include <fstream>
#include <cstdint>
#include "foundation.hpp"

// GPU attachment and readback diagnostic, not production scene rendering.
enum class TargetResult { pass, unsupported, fail };
static TargetResult validateTarget(){
    constexpr uint16_t w=bb::Settings::width,h=bb::Settings::height;
    constexpr auto format=bgfx::TextureFormat::BGRA8;
    constexpr uint64_t rtFlags=BGFX_TEXTURE_RT|BGFX_SAMPLER_MIN_POINT|BGFX_SAMPLER_MAG_POINT|BGFX_SAMPLER_MIP_POINT;
    constexpr uint64_t readFlags=BGFX_TEXTURE_BLIT_DST|BGFX_TEXTURE_READ_BACK;
    if(!bgfx::isTextureValid(0,false,1,format,rtFlags)||!bgfx::isTextureValid(0,false,1,format,readFlags)){
        std::cout<<"1280x720 GPU readback unsupported on selected backend\n";return TargetResult::unsupported;
    }
    const auto target=bgfx::createFrameBuffer(w,h,format,rtFlags);
    const auto readback=bgfx::createTexture2D(w,h,false,1,format,readFlags);
    if(!bgfx::isValid(target)||!bgfx::isValid(readback)){
        if(bgfx::isValid(target))bgfx::destroy(target);
        if(bgfx::isValid(readback))bgfx::destroy(readback);
        return TargetResult::fail;
    }
    constexpr bgfx::ViewId render=1,copy=2;
    std::vector<uint8_t> bytes(size_t(w)*h*4);
    bool pass=true;
    for(uint32_t rgba:{0x123456ffu,0xe79527ffu}){
        bgfx::setViewFrameBuffer(render,target);
        bgfx::setViewRect(render,0,0,w,h);
        bgfx::setViewClear(render,BGFX_CLEAR_COLOR,rgba);
        bgfx::touch(render);bgfx::frame();
        bgfx::TextureRegion dst{readback},src{bgfx::getTexture(target)};
        bgfx::blit(copy,dst,src);bgfx::frame();
        const uint32_t ready=bgfx::read(dst,bytes.data());
        // Retain the destination buffer until the asynchronous GPU read completes.
        uint32_t frame=bgfx::frame();
        while(int32_t(frame-ready)<0)frame=bgfx::frame();
        size_t mismatch=0;
        for(size_t i=0;i<bytes.size();i+=4){
            mismatch+=bytes[i]!=uint8_t(rgba>>8)||bytes[i+1]!=uint8_t(rgba>>16)
                      ||bytes[i+2]!=uint8_t(rgba>>24)||bytes[i+3]!=uint8_t(rgba);
        }
        std::cout<<"1280x720 target clear 0x"<<std::hex<<rgba<<std::dec
                 <<" mismatched pixels="<<mismatch<<" of "<<size_t(w)*h<<'\n';
        pass=pass&&mismatch==0;
    }
    // Save the actual GPU-read pixels (last clear) for independent inspection.
    std::ofstream image("stage1-gpu-readback.ppm",std::ios::binary);
    if(image){image<<"P6\n"<<w<<" "<<h<<"\n255\n";for(size_t i=0;i<bytes.size();i+=4){char rgb[]={char(bytes[i+2]),char(bytes[i+1]),char(bytes[i])};image.write(rgb,3);}}
    bgfx::setViewFrameBuffer(render,BGFX_INVALID_HANDLE);
    bgfx::setViewClear(render,BGFX_CLEAR_NONE);
    bgfx::destroy(readback);bgfx::destroy(target);bgfx::frame();
    return pass?TargetResult::pass:TargetResult::fail;
}

int main(int argc,char** argv){
    if(!SDL_Init(SDL_INIT_VIDEO|SDL_INIT_GAMEPAD)){std::cerr<<SDL_GetError()<<'\n';return 1;}
    bool automated=argc>1&&std::string_view(argv[1])=="--smoke";
    auto* window=SDL_CreateWindow("Brick Breaker | Stage 1 GPU diagnostics",bb::Settings::width,bb::Settings::height,SDL_WINDOW_RESIZABLE|SDL_WINDOW_HIGH_PIXEL_DENSITY);
    if(!window){std::cerr<<SDL_GetError()<<'\n';SDL_Quit();return 2;}
    auto* hwnd=SDL_GetPointerProperty(SDL_GetWindowProperties(window),SDL_PROP_WINDOW_WIN32_HWND_POINTER,nullptr);
    if(!hwnd){std::cerr<<"No HWND\n";SDL_DestroyWindow(window);SDL_Quit();return 3;}
    int width=0,height=0;SDL_GetWindowSizeInPixels(window,&width,&height);
    bgfx::Init init;init.swapChain.nwh=hwnd;init.swapChain.width=width;init.swapChain.height=height;init.reset=BGFX_RESET_VSYNC;
    // Explicit priority avoids requiring Vulkan; bgfx automatic selection is a final option.
    bool ready=false;
    for(auto backend:{bgfx::RendererType::Direct3D11,bgfx::RendererType::Direct3D12,bgfx::RendererType::OpenGL,bgfx::RendererType::Vulkan,bgfx::RendererType::Count}){init.type=backend;std::cout<<"Trying backend "<<int(backend)<<std::endl;if(bgfx::init(init)){if(bgfx::getRendererType()!=bgfx::RendererType::Noop){ready=true;break;}bgfx::shutdown();}}
    if(!ready){std::cerr<<"All GPU initialization attempts failed\n";SDL_DestroyWindow(window);SDL_Quit();return 4;}
    const auto* caps=bgfx::getCaps();std::cout<<"bgfx API: "<<BGFX_API_VERSION<<"\nRenderer: "<<bgfx::getRendererName(bgfx::getRendererType())<<" compute_supported="<<bool(caps->supported&BGFX_CAPS_COMPUTE)<<'\n';
    const auto targetResult=validateTarget();
    const char* targetLabel=targetResult==TargetResult::pass?"PASS":targetResult==TargetResult::unsupported?"UNSUPPORTED":"FAIL";
    std::cout<<"Offscreen target: "<<targetLabel<<std::endl;
    bgfx::setDebug(BGFX_DEBUG_TEXT);bgfx::setViewClear(0,BGFX_CLEAR_COLOR,0x101217ff);
    bool running=true;int frames=0;while(running){SDL_Event e;while(SDL_PollEvent(&e)){if(e.type==SDL_EVENT_QUIT||(e.type==SDL_EVENT_KEY_DOWN&&e.key.key==SDLK_ESCAPE))running=false;if(e.type==SDL_EVENT_WINDOW_PIXEL_SIZE_CHANGED){SDL_GetWindowSizeInPixels(window,&width,&height);if(width>0&&height>0){bgfx::SwapChain sc;sc.width=width;sc.height=height;bgfx::reset(BGFX_RESET_VSYNC,&sc);}}}
      if(width>0&&height>0){bgfx::setViewRect(0,0,0,uint16_t(std::min(width,65535)),uint16_t(std::min(height,65535)));bgfx::touch(0);bgfx::dbgTextClear();bgfx::dbgTextPrintf(1,1,0x0f,"BRICK BREAKER / STAGE 1 DIAGNOSTICS");bgfx::dbgTextPrintf(1,3,0x07,"Backend: %s | %dx%d",bgfx::getRendererName(bgfx::getRendererType()),width,height);bgfx::dbgTextPrintf(1,4,0x07,"Compute: %s | Input: Esc to exit",(caps->supported&BGFX_CAPS_COMPUTE)?"available":"unavailable");bgfx::dbgTextPrintf(1,5,0x07,"1280x720 attachment/readback: %s",targetLabel);bgfx::frame();++frames;}else SDL_Delay(16);if(automated&&frames>=120)running=false;}
    bgfx::shutdown();SDL_DestroyWindow(window);SDL_Quit();std::cout<<"Rendered frames: "<<frames<<'\n';return frames==0?5:targetResult==TargetResult::fail?6:(automated&&targetResult==TargetResult::unsupported)?7:0;
}
