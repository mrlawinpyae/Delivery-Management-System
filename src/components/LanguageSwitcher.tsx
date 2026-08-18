import { useTranslation } from '../hooks/useTranslation';
import { useLanguageStore } from '../store/useLanguageStore';
import { motion } from 'framer-motion';
import { useThemeStore } from "@/store/useThemeStore";

export const LanguageSwitcher = ({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) => {
  const { language } = useTranslation();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  const isVert = orientation === 'vertical';

  return (
    <div
      className={`relative flex items-center rounded-full p-[3px] transition-colors ${
        isVert ? "flex-col h-14 w-7" : "flex-row h-7 w-14"
      } ${
        isDark ? "bg-slate-800/80 border border-slate-700/50" : "bg-slate-200 border border-slate-300/50"
      }`}
    >
      {/* Sliding background */}
      <motion.div
        className={`absolute rounded-full shadow-sm ${
          isVert ? "h-[25px] w-[22px]" : "h-[22px] w-[25px]"
        } ${isDark ? "bg-slate-600" : "bg-white"}`}
        layout
        initial={false}
        animate={
          isVert
            ? { y: language === 'en' ? 0 : 25, x: 0 }
            : { x: language === 'en' ? 0 : 25, y: 0 }
        }
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
      
      <button
        onClick={() => setLanguage('en')}
        className={`relative z-10 flex-1 flex items-center justify-center text-[9px] font-bold tracking-wider w-full h-full ${
          language === 'en'
            ? isDark ? 'text-white' : 'text-slate-800'
            : isDark ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        EN
      </button>
      
      <button
        onClick={() => setLanguage('mm')}
        className={`relative z-10 flex-1 flex items-center justify-center text-[9px] font-bold tracking-wider w-full h-full ${
          language === 'mm'
            ? isDark ? 'text-white' : 'text-slate-800'
            : isDark ? 'text-slate-400' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        MM
      </button>
    </div>
  );
};
