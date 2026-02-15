import { motion } from "framer-motion";

export function AnimatedCard({ children, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
