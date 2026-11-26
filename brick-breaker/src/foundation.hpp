#pragma once
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <stdexcept>
namespace bb {
struct Settings {
    static constexpr int width=1280, height=720, hz=120, substeps=4;
    static constexpr const char* backend="auto";
    static constexpr const char* materials="hybrid";
};
// Integer rational accumulator: exact 120 ticks per second, no rounded tick interval.
class FixedClock {
    std::int64_t phase_=0, ticks_=0, dropped_=0;
public:
    static constexpr std::int64_t scale=1'000'000'000;
    template<class F> int advance(std::chrono::nanoseconds elapsed,F&& tick) {
        if(elapsed.count()<0) throw std::invalid_argument("negative time");
        const auto accepted=std::min(elapsed.count(),std::int64_t{250'000'000});
        dropped_+=elapsed.count()-accepted;
        phase_+=accepted*Settings::hz;
        int n=0;
        while(phase_>=scale) {tick(1.0f/Settings::hz);phase_-=scale;++ticks_;++n;}
        return n;
    }
    double alpha() const {return double(phase_)/scale;}
    std::int64_t ticks() const {return ticks_;}
    std::int64_t dropped_ns() const {return dropped_;}
};
struct Viewport {int x,y,w,h;};
inline Viewport viewport(int w,int h) {
    if(w<=0||h<=0)return {0,0,0,0};
    const auto k=std::min(double(w)/Settings::width,double(h)/Settings::height);
    const int vw=int(Settings::width*k), vh=int(Settings::height*k);
    return {(w-vw)/2,(h-vh)/2,vw,vh};
}
}
