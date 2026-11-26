#include "foundation.hpp"
#include <iostream>
#include <cstdlib>
using namespace std::chrono_literals;
void check(bool ok,const char* name){if(!ok){std::cerr<<"FAIL "<<name<<'\n';std::exit(1);}std::cout<<"PASS "<<name<<'\n';}
int main(){
    bb::FixedClock c; int ticks=0;
    for(int i=0;i<1000;++i)c.advance(1ms,[&](float dt){if(dt!=1.0f/120)std::exit(2);++ticks;});
    check(ticks==120 && c.ticks()==120 && c.alpha()==0,"exact 120 Hz over one second");
    bb::FixedClock d; for(int i=0;i<60;++i)d.advance((i%3==0?16'666'666:16'666'667)*1ns,[](float){});
    check(d.ticks()==120 && d.alpha()==0,"variable frame duration exact accumulation");
    check(d.advance(1s,[](float){})==30 && d.dropped_ns()==750'000'000,"stall cap and explicit dropped time");
    bool rejected=false;try{d.advance(-1ns,[](float){});}catch(const std::invalid_argument&){rejected=true;}check(rejected,"reject negative time");
    const auto v=bb::viewport(1920,1200);check(v.x==0&&v.y==60&&v.w==1920&&v.h==1080,"letterbox 16:9");
    const auto w=bb::viewport(720,1280);check(w.w==720&&w.h==405&&w.y==437,"portrait viewport");
    const auto z=bb::viewport(0,0);check(z.w==0&&z.h==0,"minimized viewport");
    check(bb::Settings::width==1280&&bb::Settings::height==720&&bb::Settings::hz==120,"approved configuration");
}
