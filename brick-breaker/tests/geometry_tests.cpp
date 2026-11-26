#include <clipper2/clipper.h>
#include <cmath>
#include <cstdlib>
#include <iostream>
using namespace Clipper2Lib;
double area(const Paths64& p){double a=0;for(const auto& path:p)a+=Area(path);return std::abs(a);}
void check(bool ok,const char* msg){std::cout<<(ok?"PASS ":"FAIL ")<<msg<<'\n';if(!ok)std::exit(1);}
bool equal(double a,double b){return std::abs(a-b)<0.01;}
int main(){
  const Paths64 solid{{{0,0},{1000,0},{1000,800},{0,800}}};
  const Paths64 cut{{{-100,-100},{400,-100},{400,900},{-100,900}}};
  auto a=Intersect(solid,cut,FillRule::NonZero);
  auto b=Difference(solid,cut,FillRule::NonZero);
  check(equal(area(a),320000)&&equal(area(b),480000),"partition area");
  check(equal(area(a)+area(b),area(solid)),"no material lost in exact grid split");
  check(equal(area(Intersect(a,b,FillRule::NonZero)),0),"no positive-area overlap");
  check(equal(area(Union(a,b,FillRule::NonZero)),area(solid)),"reunion restores solid area");
  const Paths64 hole{{{200,200},{600,200},{600,600},{200,600}}};
  auto hollow=Difference(solid,hole,FillRule::NonZero);
  check(equal(area(hollow),640000)&&hollow.size()==2,"hole orientation and signed area");
  const Paths64 narrow{{{999,-1},{1001,-1},{1001,801},{999,801}}};
  check(equal(area(Intersect(solid,narrow,FillRule::NonZero)),800),"one-grid-unit sliver preserved");
  const Paths64 notch{{{0,0},{1000,0},{1000,200},{250,200},{250,600},{1000,600},{1000,800},{0,800}}};
  auto x=Intersect(notch,cut,FillRule::NonZero),y=Difference(notch,cut,FillRule::NonZero);
  check(equal(area(x)+area(y),area(notch))&&y.size()==2,"concave solid produces disconnected fragments");
  const Paths64 outside{{{2000,0},{3000,0},{3000,800},{2000,800}}};
  check(Intersect(solid,outside,FillRule::NonZero).empty(),"disjoint clip");
  return 0;
}
