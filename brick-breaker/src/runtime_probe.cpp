#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <bgfx/bgfx.h>
#include <iostream>
#include <string_view>
#include <algorithm>
#include "foundation.hpp"
int main(int argc,char** argv){
    if(!SDL_Init(SDL_INIT_VIDEO|SDL_INIT_GAMEPAD)){std::cerr<<SDL_GetError()<<'\n';return 1;}
    bool automated=argc>1&&std::string_view(argv[1])=="--smoke";
    auto* window=SDL_CreateWindow("Brick Breaker | Stage 1 GPU diagnostics",bb::Settings::width,bb::Settings::height,SDL_WINDOW_RESIZABLE|SDL_WINDOW_HIGH_PIXEL_DENSITY);
    if(!window){std::cerr<<SDL_GetError()<<'\n';SDL_Quit();return 2;}
    auto* hwnd=SDL_GetPointerProperty(SDL_GetWindowProperties(window),SDL_PROP_WINDOW_WIN32_HWND_POINTER,nullptr);
    if(!hwnd){std::cerr<<"No HWND\n";SDL_DestroyWindow(window);SDL_Quit();return 3;}
    int width=0,height=0;SDL_GetWindowSizeInPixels(window,&width,&height);
    bgfx::Init init;init.platformData.nwh=hwnd;init.resolution.width=width;init.resolution.height=height;init.resolution.reset=BGFX_RESET_VSYNC;
    // Explicit priority avoids requiring Vulkan; bgfx automatic selection is a final option.
    bool ready=false;
    for(auto backend:{bgfx::RendererType::Direct3D11,bgfx::RendererType::Direct3D12,bgfx::RendererType::OpenGL,bgfx::RendererType::Vulkan,bgfx::RendererType::Count}){init.type=backend;std::cout<<"Trying backend "<<int(backend)<<std::endl;if(bgfx::init(init)){if(bgfx::getRendererType()!=bgfx::RendererType::Noop){ready=true;break;}bgfx::shutdown();}}
    if(!ready){std::cerr<<"All GPU initialization attempts failed\n";SDL_DestroyWindow(window);SDL_Quit();return 4;}
    const auto* caps=bgfx::getCaps();std::cout<<"Renderer: "<<bgfx::getRendererName(bgfx::getRendererType())<<" compute_supported="<<bool(caps->supported&BGFX_CAPS_COMPUTE)<<'\n';
    bgfx::setDebug(BGFX_DEBUG_TEXT);bgfx::setViewClear(0,BGFX_CLEAR_COLOR,0x101217ff);
    bool running=true;int frames=0;while(running){SDL_Event e;while(SDL_PollEvent(&e)){if(e.type==SDL_EVENT_QUIT||(e.type==SDL_EVENT_KEY_DOWN&&e.key.key==SDLK_ESCAPE))running=false;if(e.type==SDL_EVENT_WINDOW_PIXEL_SIZE_CHANGED){SDL_GetWindowSizeInPixels(window,&width,&height);if(width>0&&height>0)bgfx::reset(width,height,BGFX_RESET_VSYNC);}}
      if(width>0&&height>0){bgfx::setViewRect(0,0,0,uint16_t(std::min(width,65535)),uint16_t(std::min(height,65535)));bgfx::touch(0);bgfx::dbgTextClear();bgfx::dbgTextPrintf(1,1,0x0f,"BRICK BREAKER / STAGE 1 DIAGNOSTICS");bgfx::dbgTextPrintf(1,3,0x07,"Backend: %s | %dx%d",bgfx::getRendererName(bgfx::getRendererType()),width,height);bgfx::dbgTextPrintf(1,4,0x07,"Compute: %s | Input: Esc to exit",(caps->supported&BGFX_CAPS_COMPUTE)?"available":"unavailable");bgfx::frame();++frames;}else SDL_Delay(16);if(automated&&frames>=120)running=false;}
    bgfx::shutdown();SDL_DestroyWindow(window);SDL_Quit();std::cout<<"Rendered frames: "<<frames<<'\n';return frames>0?0:5;
}
