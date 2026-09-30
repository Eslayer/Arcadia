import React, { useState } from 'react'
import { BookOpen, ImageOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface ComicCoverProps {
  src?: string
  alt: string
  title: string
  genre?: string
  publisher?: string
  className?: string
}

// Paleta de colores atractivos según género para portadas sin imagen
const GENRE_GRADIENTS: Record<string, string> = {
  'Superhero': 'from-blue-700 via-indigo-800 to-slate-900',
  'Sci-Fi': 'from-purple-700 via-violet-900 to-slate-900',
  'Horror': 'from-rose-900 via-stone-900 to-black',
  'Historical': 'from-amber-700 via-stone-800 to-slate-900',
  'Fantasy': 'from-emerald-700 via-teal-900 to-slate-900',
  'Manga': 'from-red-600 via-pink-800 to-stone-900',
  'Aventura': 'from-amber-600 via-orange-800 to-slate-900',
  'Acción': 'from-orange-600 via-red-800 to-neutral-900',
  'Dark Fantasy': 'from-stone-800 via-neutral-900 to-black'
}

export const ComicCover: React.FC<ComicCoverProps> = React.memo(({
  src,
  alt,
  title,
  genre = 'Comic',
  publisher = 'Arcadia',
  className = 'w-full h-full object-cover'
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { t } = useLanguage()

  const gradient = GENRE_GRADIENTS[genre] || 'from-primary-700 via-slate-800 to-slate-900'

  // Si no hay URL o si la imagen dio error 404, mostramos el placeholder estilizado
  if (!src || src.trim() === '' || src.includes('example.com') || hasError) {
    return (
      <div
        className={`relative flex flex-col justify-between p-4 bg-gradient-to-br ${gradient} text-white select-none overflow-hidden ${className}`}
      >
        {/* Banner de editorial superior */}
        <div className="flex items-center justify-between border-b border-white/20 pb-2">
          <span className="text-[10px] uppercase tracking-widest font-black text-yellow-300 truncate max-w-[120px]">
            {publisher || 'ARCADIA COMICS'}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 uppercase font-semibold">
            {genre}
          </span>
        </div>

        {/* Emblema central con título */}
        <div className="my-auto flex flex-col items-center justify-center text-center px-2 py-3">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-inner">
            <BookOpen className="w-5 h-5 text-white/90" />
          </div>
          <h3 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight line-clamp-3 uppercase drop-shadow">
            {title}
          </h3>
        </div>

        {/* Etiqueta explícita de "Sin imagen disponible" */}
        <div className="border-t border-white/20 pt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-amber-200 bg-black/25 py-1 px-2 rounded -mx-1">
          <ImageOff className="w-3.5 h-3.5 text-amber-300" />
          <span>{t('noImageAvailable')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-slate-800 flex items-center justify-center ${className}`}>
      {/* Portada con transición suave sin parpadeo blanco */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-80'
        }`}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
})

export default ComicCover
