import { motion, useInView } from "framer-motion";
import { ReactNode, useRef } from "react";

type AnimateOnScrollProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  xOffset?: number;
  scale?: number;
  rotate?: number;
  once?: boolean;
  triggerOnce?: boolean;
};

export const AnimateOnScroll = ({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  yOffset = 20,
  xOffset = 0,
  scale = 1,
  rotate = 0,
  once = true,
  triggerOnce = true,
}: AnimateOnScrollProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: triggerOnce, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ willChange: 'transform, opacity' }}
      initial={{ 
        opacity: 0, 
        y: yOffset, 
        x: xOffset, 
        scale: scale !== 1 ? 0.95 : 1,
        rotate: rotate !== 0 ? rotate - 5 : 0 
      }}
      animate={{ 
        opacity: isInView ? 1 : 0, 
        y: isInView ? 0 : yOffset, 
        x: isInView ? 0 : xOffset,
        scale: isInView ? 1 : (scale !== 1 ? 0.95 : 1),
        rotate: isInView ? rotate : (rotate !== 0 ? rotate - 5 : 0)
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export const FadeIn = (props: Omit<AnimateOnScrollProps, 'yOffset' | 'xOffset' | 'scale' | 'rotate'>) => (
  <AnimateOnScroll {...props} yOffset={0} />
);

export const SlideUp = (props: Omit<AnimateOnScrollProps, 'xOffset' | 'scale' | 'rotate'>) => (
  <AnimateOnScroll {...props} yOffset={20} />
);

export const SlideInLeft = (props: Omit<AnimateOnScrollProps, 'yOffset' | 'scale' | 'rotate'>) => (
  <AnimateOnScroll {...props} xOffset={-40} yOffset={0} />
);

export const SlideInRight = (props: Omit<AnimateOnScrollProps, 'yOffset' | 'scale' | 'rotate'>) => (
  <AnimateOnScroll {...props} xOffset={40} yOffset={0} />
);

export const ScaleIn = (props: Omit<AnimateOnScrollProps, 'yOffset' | 'xOffset' | 'rotate'>) => (
  <AnimateOnScroll {...props} scale={0.95} yOffset={0} xOffset={0} />
);

export const RotateIn = (props: Omit<AnimateOnScrollProps, 'yOffset' | 'xOffset' | 'scale'>) => (
  <AnimateOnScroll {...props} rotate={5} yOffset={0} xOffset={0} scale={1} />
);
