import React, { memo, useEffect, useRef } from 'react';

const AIAvatar = memo(({ size = 40, pulse = true, speaking = false, listening = false }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = size * 2; // retina
    canvas.width = s; canvas.height = s;

    const draw = () => {
      frameRef.current++;
      const f = frameRef.current;
      ctx.clearRect(0, 0, s, s);
      const cx = s / 2, cy = s / 2, r = s / 2 - 2;

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = listening
        ? `rgba(244,63,94,${0.4 + 0.3 * Math.sin(f * 0.12)})`
        : speaking
        ? `rgba(0,255,200,${0.4 + 0.3 * Math.sin(f * 0.08)})`
        : 'rgba(0,255,200,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating orbit ring
      if (speaking || listening) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((f * (listening ? 0.06 : 0.04)) % (Math.PI * 2));
        ctx.beginPath();
        ctx.arc(0, 0, r - 4, 0, Math.PI * 1.5);
        ctx.strokeStyle = listening ? 'rgba(244,63,94,0.5)' : 'rgba(0,255,200,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Core circle fill
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r - 6);
      grad.addColorStop(0, 'rgba(15,31,53,0.95)');
      grad.addColorStop(1, 'rgba(6,13,30,0.99)');
      ctx.beginPath();
      ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Neon glow core
      const glow = ctx.createRadialGradient(cx, cy * 0.75, 0, cx, cy, r * 0.7);
      const alpha = speaking ? 0.18 + 0.08 * Math.sin(f * 0.15)
                 : listening ? 0.2 + 0.1 * Math.sin(f * 0.2)
                 : 0.08 + 0.03 * Math.sin(f * 0.04);
      glow.addColorStop(0, listening ? `rgba(244,63,94,${alpha})` : `rgba(0,255,200,${alpha})`);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Eyes
      const eyeColor = listening ? '#f43f5e' : speaking ? '#00ffc8' : '#f5c842';
      const eyeGlow  = listening ? 'rgba(244,63,94,0.8)' : 'rgba(0,255,200,0.8)';
      const blink    = Math.sin(f * 0.03) > 0.97;
      const eyeY     = cy - r * 0.1;
      [-0.22, 0.22].forEach(xOff => {
        const ex = cx + r * xOff;
        if (!blink) {
          ctx.shadowColor = eyeGlow; ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(ex, eyeY, r * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = eyeColor;
          ctx.fill();
          ctx.shadowBlur = 0;
          // Pupil highlight
          ctx.beginPath();
          ctx.arc(ex - r * 0.025, eyeY - r * 0.025, r * 0.035, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(ex - r * 0.1, eyeY);
          ctx.lineTo(ex + r * 0.1, eyeY);
          ctx.strokeStyle = eyeColor; ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Mouth / voice visualiser
      const mouthY = cy + r * 0.22;
      if (speaking) {
        const bars = 7;
        const w = r * 0.55 / bars;
        for (let i = 0; i < bars; i++) {
          const h = r * 0.08 + r * 0.14 * Math.abs(Math.sin(f * 0.18 + i * 0.8));
          const bx = cx - (r * 0.55 / 2) + i * (r * 0.55 / bars) + w * 0.2;
          ctx.shadowColor = 'rgba(0,255,200,0.6)'; ctx.shadowBlur = 4;
          ctx.fillStyle = `rgba(0,255,200,${0.5 + 0.5 * (h / (r * 0.22))})`;
          ctx.fillRect(bx, mouthY - h / 2, w * 0.6, h);
          ctx.shadowBlur = 0;
        }
      } else if (listening) {
        ctx.beginPath();
        ctx.arc(cx, mouthY, r * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,63,94,${0.5 + 0.4 * Math.sin(f * 0.2)})`;
        ctx.shadowColor = 'rgba(244,63,94,0.8)'; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(cx, mouthY - r * 0.03, r * 0.12, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Corner tick marks
      const tick = r * 0.18;
      [[cx - r + 2, cy - r + 2, 0, tick, tick, 0],
       [cx + r - 2, cy - r + 2, -tick, 0, 0, tick],
       [cx - r + 2, cy + r - 2, 0, -tick, tick, 0],
       [cx + r - 2, cy + r - 2, -tick, 0, 0, -tick]].forEach(([x,y,dx1,dy1,dx2,dy2]) => {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + dx1, y + dy1);
        ctx.moveTo(x, y); ctx.lineTo(x + dx2, y + dy2);
        ctx.strokeStyle = 'rgba(0,255,200,0.3)'; ctx.lineWidth = 1;
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [size, speaking, listening]);

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <canvas
        ref={canvasRef}
        style={{ width:size, height:size, display:'block' }}
      />
      {pulse && (
        <span style={{
          position:'absolute', bottom:1, right:1,
          width: Math.max(7, size * 0.2), height: Math.max(7, size * 0.2),
          borderRadius:'50%',
          background: listening ? '#f43f5e' : speaking ? '#00ffc8' : '#00ffc8',
          border: '1.5px solid #000510',
          boxShadow: listening ? '0 0 6px rgba(244,63,94,0.8)' : '0 0 6px rgba(0,255,200,0.8)',
          animation: 'pulseNeon 1.5s infinite',
        }}/>
      )}
    </div>
  );
});

export default AIAvatar;
