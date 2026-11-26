#include "foundation.hpp"
#include <box2d/box2d.h>
#include <chrono>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
struct World { b2WorldId id; explicit World(float g=0){auto def=b2DefaultWorldDef();def.gravity={0,g};id=b2CreateWorld(&def);} ~World(){b2DestroyWorld(id);} World(const World&)=delete; };
b2BodyId box(World& w,b2Vec2 p,float hx,float hy,b2BodyType type,float friction,float restitution){auto d=b2DefaultBodyDef();d.position=p;d.type=type;auto id=b2CreateBody(w.id,&d);auto s=b2DefaultShapeDef();s.density=1;s.material.friction=friction;s.material.restitution=restitution;auto poly=b2MakeBox(hx,hy);b2CreatePolygonShape(id,&s,&poly);return id;}
b2BodyId ball(World& w,b2Vec2 p,b2Vec2 v,float r,float restitution){auto d=b2DefaultBodyDef();d.position=p;d.linearVelocity=v;d.type=b2_dynamicBody;d.isBullet=true;auto id=b2CreateBody(w.id,&d);auto s=b2DefaultShapeDef();s.density=1;s.material.friction=0;s.material.restitution=restitution;b2Circle c={{0,0},r};b2CreateCircleShape(id,&s,&c);return id;}
void step(World& w,int n=1){for(int i=0;i<n;++i)b2World_Step(w.id,1.f/bb::Settings::hz,bb::Settings::substeps);}
int main(){int fails=0;auto report=[&](const char* n,bool pass){std::cout<<(pass?"PASS ":"FAIL ")<<n<<'\n';fails+=!pass;};
    for(float speed:{30.f,60.f,100.f,180.f}){
      World w;box(w,{0,0},.025f,10,b2_staticBody,0,1);auto b=ball(w,{-1,0},{speed,0},.1f,1);step(w,12);auto p=b2Body_GetPosition(b);auto v=b2Body_GetLinearVelocity(b);std::cout<<"CCD speed="<<speed<<" x="<<p.x<<" vx="<<v.x<<'\n';report("thin-wall containment and bounce",p.x<0&&v.x<0&&std::isfinite(p.x));
    }
    {World w;box(w,{0,0},.1f,10,b2_staticBody,0,.8f);auto b=ball(w,{-1,0},{10,0},.1f,.8f);step(w,30);float vx=b2Body_GetLinearVelocity(b).x;std::cout<<"restitution ratio="<<-vx/10<<'\n';report("restitution within tolerance",std::abs(vx+8)<1.5f);}
    {World w(-10);box(w,{0,-.5f},100,.5f,b2_staticBody,.8f,0);auto b=box(w,{0,.51f},.5f,.5f,b2_dynamicBody,.8f,0);b2Body_SetLinearVelocity(b,{8,0});step(w,240);auto v=b2Body_GetLinearVelocity(b);report("friction slows slider",std::abs(v.x)<1);}
    {World w;auto b=ball(w,{-2,0},{20,0},.2f,0);auto t=box(w,{0,0},.3f,.3f,b2_dynamicBody,0,0);step(w,30);report("dynamic target receives impulse",b2Body_GetLinearVelocity(t).x>1&&b2Body_GetLinearVelocity(b).x<19);}
    {World w(-10);box(w,{0,-.5f},30,.5f,b2_staticBody,.6f,0);for(int y=0;y<25;++y)for(int x=0;x<40;++x)box(w,{(x-20)*.55f, .3f+y*.55f},.24f,.24f,b2_dynamicBody,.5f,.15f);std::vector<double> ms;for(int i=0;i<240;++i){auto a=std::chrono::steady_clock::now();step(w);auto b=std::chrono::steady_clock::now();ms.push_back(std::chrono::duration<double,std::milli>(b-a).count());}std::sort(ms.begin(),ms.end());std::cout<<"1000-body stress: median_ms="<<ms[120]<<" p95_ms="<<ms[227]<<" max_ms="<<ms.back()<<" budget_ms=8.333\n";report("physics p95 within 120Hz budget",ms[227]<1000.0/120);}
    return fails?1:0;
}
