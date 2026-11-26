#pragma once
#include <cstdint>
#include <vector>
#include <cstddef>
#include <stdexcept>
namespace bb::transport {
// Test ABI, not the final simulation cell model. Explicit byte layout, no host padding.
constexpr uint16_t width=1024,height=512;
constexpr size_t cell_count=size_t(width)*height, byte_count=cell_count*4;
struct Cell {uint8_t material, damage; uint16_t temperature;};
inline void encode(uint8_t* p,Cell c){
    p[0]=c.material;p[1]=c.damage;p[2]=uint8_t(c.temperature);p[3]=uint8_t(c.temperature>>8);
}
inline Cell decode(const uint8_t* p){
    return {p[0],p[1],uint16_t(uint16_t(p[2])|(uint16_t(p[3])<<8))};
}
inline std::vector<uint8_t> fixture(uint32_t epoch){
    std::vector<uint8_t> b(byte_count);
    for(uint32_t y=0;y<height;++y)for(uint32_t x=0;x<width;++x){
      uint32_t i=y*width+x;
      encode(b.data()+size_t(i)*4,{uint8_t((x+3*y+epoch)%17),uint8_t((i*37+epoch*11)&255),uint16_t((i*257+epoch*4093)&65535)});
    }
    return b;
}
inline uint64_t hash(const std::vector<uint8_t>& b){
    uint64_t h=14695981039346656037ull;for(uint8_t v:b){h^=v;h*=1099511628211ull;}return h;
}
}
