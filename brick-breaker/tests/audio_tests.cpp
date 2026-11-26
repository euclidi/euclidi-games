#define MINIAUDIO_IMPLEMENTATION
#define MA_NO_DEVICE_IO
#include "miniaudio.h"
#include <vector>
#include <array>
#include <cstdint>
#include <iostream>
#include <cstdlib>
#include <cmath>
void check(bool pass,const char* n){std::cout<<(pass?"PASS ":"FAIL ")<<n<<'\n';if(!pass)std::exit(1);}
int main(){
  // Known PCM fixture, not a production sound effect.
  std::vector<uint8_t> b;
  auto text=[&](const char* s){for(int i=0;i<4;++i)b.push_back(uint8_t(s[i]));};
  auto u16=[&](uint16_t v){b.push_back(uint8_t(v));b.push_back(uint8_t(v>>8));};
  auto u32=[&](uint32_t v){u16(uint16_t(v));u16(uint16_t(v>>16));};
  constexpr uint32_t n=4800, rate=48000;
  text("RIFF");u32(36+n*2);text("WAVE");text("fmt ");u32(16);u16(1);u16(1);u32(rate);u32(rate*2);u16(2);u16(16);text("data");u32(n*2);
  for(uint32_t i=0;i<n;++i)u16(uint16_t(int(i%1024)-512));
  ma_decoder decoder{};
  auto cfg=ma_decoder_config_init(ma_format_s16,1,rate);
  check(ma_decoder_init_memory(b.data(),b.size(),&cfg,&decoder)==MA_SUCCESS,"native WAV decoder initialization");
  ma_uint64 length=0;
  check(ma_decoder_get_length_in_pcm_frames(&decoder,&length)==MA_SUCCESS&&length==n,"sample count");
  std::vector<int16_t> out(n);ma_uint64 frames=0;
  auto result=ma_decoder_read_pcm_frames(&decoder,out.data(),n,&frames);
  check((result==MA_SUCCESS||result==MA_AT_END)&&frames==n,"full PCM decode");
  size_t errors=0;for(uint32_t i=0;i<n;++i)errors+=out[i]!=int(i%1024)-512;
  check(errors==0,"bit-exact PCM data");
  check(ma_decoder_seek_to_pcm_frame(&decoder,1023)==MA_SUCCESS,"sample-accurate seek");
  int16_t sample=0;frames=0;result=ma_decoder_read_pcm_frames(&decoder,&sample,1,&frames);
  check((result==MA_SUCCESS||result==MA_AT_END)&&frames==1&&sample==511,"seek content");
  ma_decoder_uninit(&decoder);
  std::cout<<"Offline decoder only; no playback device, production audio or mixing tested.\n";
}
