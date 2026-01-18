"use client"

import { motion } from "framer-motion"

export default function GlobalLoader() {
    const primaryColor = "#00A896" // Teal
    const secondaryColor = "#2C3E50" // Dark Blue-Gray
    const accentGray = "#7F8C8D" // Accent Gray
    const dividerColor = "#BDC3C7" // Light Gray

    const textVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                type: "spring" as const,
                stiffness: 100,
            },
        }),
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white font-[Rubik]">
            <motion.div
                className="flex items-center gap-4"
                initial="hidden"
                animate="visible"
                style={{ direction: 'ltr' }}
            >
                {/* CLICK Text */}
                <div className="flex text-5xl font-bold tracking-tight" style={{ color: secondaryColor, direction: "ltr" }}>
                    {["C", "L", "I", "C", "K"].map((char, i) => (
                        <motion.span key={i} custom={i} variants={textVariants}>
                            {char}
                        </motion.span>
                    ))}
                    {/* Animated Dot */}
                    <div className="relative flex items-center justify-center mx-1">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            transition={{
                                delay: 0.6,
                                duration: 0.6,
                                type: "spring" as const,
                                stiffness: 200,
                                damping: 10
                            }}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {/* Pulse / Ripple Effect */}
                            <motion.div
                                animate={{
                                    scale: [1, 2.5],
                                    opacity: [0.5, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                    delay: 1.2, // Start pulsing after entrance
                                }}
                                className="absolute inset-0 rounded-full"
                                style={{ backgroundColor: primaryColor }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Divider */}
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "40px", opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="w-[2px] rounded-full"
                    style={{ backgroundColor: dividerColor }}
                />

                {/* DNG HUB Text */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                    className="text-2xl font-medium tracking-wide"
                    style={{ color: accentGray }}
                >
                    DNG HUB
                </motion.div>
            </motion.div>
        </div>
    )
}
