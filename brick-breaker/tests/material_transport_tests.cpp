#include "material_transport.hpp"
#include <iostream>
#include <cstdlib>
using namespace bb::transport;
void check(bool pass,const char* name){std::cout<<(pass?"PASS ":"FAIL ")<<name<<'\n';if(!pass)std::exit(1);}
int main(){
  uint8_t bytes[4];encode(bytes,{7,255,0xabcd});auto c=decode(bytes);
  check(bytes[0]==7&&bytes[1]==255&&bytes[2]==0xcd&&bytes[3]==0xab,"explicit little-endian cell ABI");
  check(c.material==7&&c.damage==255&&c.temperature==0xabcd,"lossless cell decoding");
  auto a=fixture(1),b=fixture(2),again=fixture(1);
  check(a.size()==2097152&&cell_count==524288,"524288 cells / 2 MiB transport payload");
  check(a==again&&hash(a)==hash(again),"deterministic snapshot");
  check(a!=b&&hash(a)!=hash(b),"epoch changes snapshot");
  size_t mismatches=0;
  for(uint32_t y=0;y<height;++y)for(uint32_t x=0;x<width;++x){
    uint32_t i=y*width+x;auto v=decode(a.data()+size_t(i)*4);
    mismatches+=v.material!=(x+3*y+1)%17||v.damage!=((i*37+11)&255)||v.temperature!=((i*257+4093)&65535);
  }
  check(mismatches==0,"all cell fields round-trip");
  std::cout<<"snapshot_hash="<<hash(a)<<'\n';
}
