import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

export function StealthManager() {
  const navigate = useNavigate();
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const handleTrigger = () => {
      setTriggering(true);
      // Wait for ripple, then navigate to Veil
      setTimeout(() => {
        navigate("/veil", { state: { fromStealth: true } });
        setTimeout(() => setTriggering(false), 200); // give time for veil to mount
      }, 400); 
    };

    window.addEventListener("veil_stealth_trigger", handleTrigger);
    return () => window.removeEventListener("veil_stealth_trigger", handleTrigger);
  }, [navigate]);

  return (
    <AnimatePresence>
      {triggering && (
        <motion.div
          key="stealth-ripple"
          className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-end p-4"
        >
          <motion.div
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            exit={{ backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ width: 40, height: 40, borderRadius: "100%", backgroundColor: "rgba(176,38,255,0.4)", scale: 1, opacity: 1 }}
            animate={{ scale: 50, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-2 mr-2"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
