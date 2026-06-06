import React, { memo } from 'react';

const CFG = {
  calm:      { icon:'◈', label:'CALM',      cls:'tag-neon'  },
  confused:  { icon:'◎', label:'CONFUSED',  cls:'tag-gold'  },
  stressed:  { icon:'◉', label:'STRESSED',  cls:'tag-blue'  },
  frustrated:{ icon:'◈', label:'FRUSTRATED',cls:'tag-red'   },
};

const EmotionBadge = memo(({ emotion = 'calm', size = 'sm' }) => {
  const cfg = CFG[emotion] || CFG.calm;
  return (
    <span className={`tag-x ${cfg.cls}`} style={{ fontSize: size === 'sm' ? 9 : 11 }}>
      <span style={{ animation:'pulseNeon 2s infinite', display:'inline-block' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
});

export default EmotionBadge;
