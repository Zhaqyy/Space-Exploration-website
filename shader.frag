// Author:
// Title:

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform vec3 u_mouse;
uniform float u_time;

#define iTime u_time
#define iMouse u_mouse
#define iResolution u_resolution


#define iterations 4
#define formuparam2 0.89
 
#define volsteps 10
#define stepsize 0.190
 
#define zoom 3.900
#define tile   0.450
#define speed2  0.010
 
#define brightness 0.2
#define darkmatter 0.400
#define distfading 0.560
#define saturation 0.400


#define transverseSpeed 1.1
#define cloud 0.2

 
float triangle(float x, float a) {
	float output2 = 2.0 * abs(3.0 * ((x / a) - floor((x / a) + 0.5))) - 1.0;
	return output2;
}
 

float field(in vec3 p) {
	
	float strength = 7.0 + 0.03 * log(1.e-6 + fract(sin(iTime) * 4373.11));
	float accum = 0.;
	float prev = 0.;
	float tw = 0.;
	

	for (int i = 0; i < 6; ++i) {
		float mag = dot(p, p);
		p = abs(p) / mag + vec3(-.5, -.8 + 0.1 * sin(iTime * 0.2 + 2.0), -1.1 + 0.3 * cos(iTime * 0.15));
		float w = exp(-float(i) / 7.);
		accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
		tw += w;
		prev = mag;
	}
	return max(0., 5. * accum / tw - .7);
}



void main( )
{
   
     	vec2 uv2 = 2. * gl_FragCoord.xy / iResolution.xy - 1.;
	vec2 uvs = uv2 * iResolution.xy / max(iResolution.x, iResolution.y);
	

	
	float time2 = iTime * 0.000001;
               
        float speed = speed2;
        speed = 0.005 * cos(time2*0.02 + 3.1415926/4.0);
    	float formuparam = formuparam2;
	//get coords and direction
	vec2 uv = uvs;
	//mouse rotation
	float a_xz = 0.9;
	float a_yz = -.6;
	float a_xy = 0.9 + iTime*0.04;
	
	
	mat2 rot_xz = mat2(cos(a_xz),sin(a_xz),-sin(a_xz),cos(a_xz));
	
	mat2 rot_yz = mat2(cos(a_yz),sin(a_yz),-sin(a_yz),cos(a_yz));
		
	mat2 rot_xy = mat2(cos(a_xy),sin(a_xy),-sin(a_xy),cos(a_xy));
	

	float v2 =1.0;
	
	vec3 dir=vec3(uv*zoom,1.);
 
	vec3 from=vec3(0.0, 0.0,0.0);
 
                               
        from.x -= 5.0* (0.5);
        from.y -= 5.0* (0.5);
               
               
	vec3 forward = vec3(0.,0.,1.);
               

	from.x += transverseSpeed*(1.0)*cos(0.01*iTime) + 0.001*iTime;
		from.y += transverseSpeed*(1.0)*sin(0.01*iTime) +0.001*iTime;
	
	from.z += 0.003*iTime;
	
	
	dir.xy*=rot_xy;
	forward.xy *= rot_xy;

	dir.xz*=rot_xz;
	forward.xz *= rot_xz;
		
	
	dir.yz*= rot_yz;
	forward.yz *= rot_yz;
	 

	
	from.xy*=-rot_xy;
	from.xz*=rot_xz;
	from.yz*= rot_yz;
	 
	
	//zoom
	float zooom = (time2-3311.)*speed;
	from += forward* zooom;
	float sampleShift = mod( zooom, stepsize );
	 
	float zoffset = -sampleShift;
	sampleShift /= stepsize; // make from 0 to 1


	
	//volumetric rendering
	float s=0.24;
	float s3 = s + stepsize/2.0;
	vec3 v=vec3(0.);
	float t3 = 0.0;
	
	
	vec3 backCol2 = vec3(0.);
	for (int r=0; r<volsteps; r++) {
		vec3 p2=from+(s+zoffset)*dir;// + vec3(0.,0.,zoffset);
		vec3 p3=(from+(s3+zoffset)*dir )* (1.9/zoom);// + vec3(0.,0.,zoffset);
		
		p2 = abs(vec3(tile)-mod(p2,vec3(tile*2.))); // tiling fold
		p3 = abs(vec3(tile)-mod(p3,vec3(tile*2.))); // tiling fold
		
		#ifdef cloud
		t3 = field(p3);
		#endif
		
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) {
			p2=abs(p2)/dot(p2,p2)-formuparam; // the magic formula
			//p=abs(p)/max(dot(p,p),0.005)-formuparam; // another interesting way to reduce noise
			float D = abs(length(p2)-pa); // absolute sum of average change
			
			if (i > 2)
			{
			a += i > 7 ? min( 12., D) : D;
			}
				pa=length(p2);
		}
		
		
		//float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		//if (r>3) fade*=1.-dm; // dark matter, don't render near
		// brightens stuff up a bit
		float s1 = s+zoffset;
		// need closed form expression for this, now that we shift samples
		float fade = pow(distfading,max(0.,float(r)-sampleShift));
		
		
		//t3 += fade;
		
		v+=fade;
	       		//backCol2 -= fade;

		// fade out samples as they approach the camera
		if( r == 0 )
			fade *= (1. - (sampleShift));
		// fade in samples as they approach from the distance
		if( r == volsteps-1 )
			fade *= sampleShift;
		v+=vec3(s1,s1*s1,s1*s1*s1*s1)*a*brightness*fade; // coloring based on distance
		
		backCol2 += mix(.4, 1., v2) * vec3(0.20 * t3 * t3 * t3, 0.4 * t3 * t3, t3 * 0.7) * fade;

		
		s+=stepsize;
		s3 += stepsize;
		
		
		
		}
		       
	v=mix(vec3(length(v)),v,saturation);
	vec4 forCol2 = vec4(v*.01,1.);
	
	#ifdef cloud
	backCol2 *= cloud;
	#endif
    
	gl_FragColor = forCol2 + vec4(backCol2, 1.0);
}


// // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// #define HASHSCALE1 .1031

// //From Dave_Hoskins (https://www.shadertoy.com/view/4djSRW)
// float hash12(vec2 p)
// {
// 	vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
//     p3 += dot(p3, p3.yzx + 19.19);
//     return fract((p3.x + p3.y) * p3.z);
// }

// // Convert Noise2d() into a "star field" by stomping everthing below fThreshhold to zero.
// float NoisyStarField( in vec2 vSamplePos, float fThreshhold )
// {
//     float StarVal = hash12( vSamplePos );
//     if ( StarVal >= fThreshhold )
//         StarVal = pow( (StarVal - fThreshhold)/(1.0 - fThreshhold), 6.0 );
//     else
//         StarVal = 0.0;
//     return StarVal;
// }

// // Stabilize NoisyStarField() by only sampling at integer values.
// float StableStarField( in vec2 vSamplePos, float fThreshhold )
// {
//     // Linear interpolation between four samples.
//     // Note: This approach has some visual artifacts.
//     // There must be a better way to "anti alias" the star field.
//     float fractX = fract( vSamplePos.x );
//     float fractY = fract( vSamplePos.y );
//     vec2 floorSample = floor( vSamplePos );    
//     float v1 = NoisyStarField( floorSample, fThreshhold );
//     float v2 = NoisyStarField( floorSample + vec2( 0.0, 1.0 ), fThreshhold );
//     float v3 = NoisyStarField( floorSample + vec2( 1.0, 0.0 ), fThreshhold );
//     float v4 = NoisyStarField( floorSample + vec2( 1.0, 1.0 ), fThreshhold );

//     float StarVal =   v1 * ( 1.0 - fractX ) * ( 1.0 - fractY )
//         			+ v2 * ( 1.0 - fractX ) * fractY
//         			+ v3 * fractX * ( 1.0 - fractY )
//         			+ v4 * fractX * fractY;
// 	return StarVal;
// }

// void main( )
// {
// 	// Sky Background Color
// 	vec3 vColor = vec3( 0.1, 0.2, 0.4 ) * gl_FragCoord.y / iResolution.y;

//     // Note: Choose fThreshhold in the range [0.99, 0.9999].
//     // Higher values (i.e., closer to one) yield a sparser starfield.
//     float StarFieldThreshhold = 0.97;

//     // Stars with a slow spin.
//     float fSpinRate = 0.001;
//     vec2 vInputPos = ( 2.0 * gl_FragCoord.xy/iResolution.y ) - vec2( 1.0, 1.0 );
//     float fSampleAngle = fSpinRate * iTime+4. + atan( vInputPos.y, vInputPos.x );
//     vec2 vSamplePos = ( 0.5 * length( vInputPos ) * vec2( cos( fSampleAngle ), sin( fSampleAngle ) ) + vec2( 0.5, 0.5 ) ) * iResolution.y;
//     float StarVal = StableStarField( vSamplePos, StarFieldThreshhold );
//     vColor += vec3( StarVal );
	
// 	gl_FragColor = vec4(vColor, 1.0);
// }

