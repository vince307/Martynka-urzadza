// Paint over the 512×1536 transparent illustrated housing, after loading Atkinson.
// Exact mapping: −30 → y1260, +30 → y300; one degree is 16px.
export const thermometerRange={min:-30,max:30,step:1,majorStep:10,pixelsPerDegree:16};
export function drawThermometerFace(ctx,celsius=10){
 if(!Number.isFinite(celsius)||celsius<-30||celsius>30)throw new RangeError('Temperature must be −30…+30 °C');
 const ink='#245C59',teal='#54BEB4',y=v=>1260-(v+30)*16;
 ctx.save();ctx.fillStyle='#245c5920';ctx.strokeStyle=ink;ctx.lineWidth=4;
 ctx.beginPath();ctx.roundRect(178,286,34,1040,17);ctx.fill();ctx.stroke();
 ctx.fillStyle=teal;ctx.beginPath();ctx.roundRect(184,y(celsius),22,1322-y(celsius),11);ctx.fill();
 ctx.beginPath();ctx.arc(195,1334,34,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle=ink;ctx.font='700 50px Atkinson';ctx.textAlign='center';ctx.fillText('°C',274,222);
 for(let v=-30;v<=30;v++){const yy=y(v);ctx.beginPath();ctx.moveTo(220,yy);ctx.lineTo(v%10===0?246:v%5===0?239:231,yy);ctx.lineWidth=v%10===0?4:2;ctx.stroke();if(v%10===0)ctx.fillText(v>0?'+'+v:v<0?'−'+(-v):'0',301,yy+17)}
 ctx.restore();
}
