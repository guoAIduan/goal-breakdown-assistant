import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createConfetti } from '@/lib/confetti';

interface CelebrationProps {
  show: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  /** 由调用方在触发庆祝时给出，用于生成一组固定的彩带参数 */
  seed?: number;
}

interface ConfettiPieceProps {
  id: number;
  delay: number;
  left: number;
  color: string;
  duration: number;
  size: number;
  rotateEnd: number;
  xDrift: number;
}

function ConfettiPiece({
  delay,
  left,
  color,
  duration,
  size,
  rotateEnd,
  xDrift,
}: ConfettiPieceProps) {
  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: ['0vh', '110vh'],
        x: [0, xDrift, xDrift * 0.5],
        opacity: [0, 1, 1, 0],
        rotate: [0, rotateEnd],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
      }}
      className="absolute rounded-sm"
      style={{
        left: `${left}%`,
        top: 0,
        width: size,
        height: size * 0.6,
        backgroundColor: color,
      }}
    />
  );
}

export default function Celebration({
  show,
  title = '恭喜完成！',
  subtitle = '你已经完成了所有步骤，真棒！',
  onClose,
  seed = 1,
}: CelebrationProps) {
  const pieces = useMemo(() => createConfetti(seed, 50), [seed]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
            onClick={onClose}
          />

          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {pieces.map((p) => (
              <ConfettiPiece
                key={p.id}
                id={p.id}
                delay={p.delay}
                left={p.left}
                color={p.color}
                duration={p.duration}
                size={p.size}
                rotateEnd={p.rotateEnd}
                xDrift={p.xDrift}
              />
            ))}
          </div>

          {/* Content card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
            className="relative z-10 max-w-sm w-[85vw] pointer-events-auto"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border/50 p-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
                className="mx-auto mb-5 size-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center"
              >
                <PartyPopper className="size-10 text-primary" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                {title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-muted-foreground mb-6 leading-relaxed"
              >
                {subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="flex items-center justify-center gap-2 text-sm text-primary/80"
              >
                <Sparkles className="size-4" />
                <span>每一步坚持都算数</span>
                <Sparkles className="size-4" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="mt-6"
              >
                <Button onClick={onClose} className="w-full rounded-xl">
                  太棒了
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
