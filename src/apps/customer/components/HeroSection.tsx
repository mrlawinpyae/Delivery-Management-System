import { motion } from "framer-motion"
import { ArrowRight, Utensils, Star, Clock } from "lucide-react"

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } },
  }

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  }

  return (
    <section className="relative w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f264a] to-[#1e3a6a] px-6 py-16 md:px-12 lg:px-20 lg:py-20 mb-12 shadow-2xl">
      {/* Abstract Background Elements */}
      <motion.div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-[100px]"
        variants={floatingVariants}
        animate="animate"
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: "1s" }}
      />
      
      {/* Floating Badges */}
      <motion.div 
        className="hidden md:flex absolute top-12 right-24 items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-white shadow-xl"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: "0.5s" }}
      >
        <Star className="text-amber-400" size={16} fill="currentColor" />
        <span className="text-sm font-medium">Premium Kitchens</span>
      </motion.div>

      <motion.div 
        className="hidden md:flex absolute bottom-20 right-48 items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 text-white shadow-xl"
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: "1.5s" }}
      >
        <Clock className="text-emerald-400" size={16} />
        <span className="text-sm font-medium">Fast Delivery</span>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-start max-w-2xl"
      >
        <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm border border-white/20">
          <Utensils size={14} className="text-amber-400" />
          <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">Magway Exclusive</span>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl mb-6"
        >
          Elevate Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            Dining Experience
          </span>
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="mb-10 text-lg text-zinc-300 md:text-xl font-light leading-relaxed max-w-xl"
        >
          Discover curated premium kitchens and artisanal flavors delivered straight to your door with unparalleled care.
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex gap-4">
          <button 
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#0f264a] shadow-lg transition-transform hover:scale-105 active:scale-95"
            onClick={() => {
              window.scrollTo({ top: 500, behavior: 'smooth' })
            }}
          >
            <span>Explore Kitchens</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  )
}
