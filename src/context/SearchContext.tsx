import { createContext, useContext, useState } from "react"

const SearchContext = createContext({
  isSearchOpen: false,
  toggleSearch: () => {},
  searchTerm: "",
  setSearchTerm: (term: string) => {},
})

export const SearchProvider = ({ children }: any) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <SearchContext.Provider
      value={{
        isSearchOpen,
        toggleSearch: () => setIsSearchOpen(!isSearchOpen),
        searchTerm,
        setSearchTerm,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => useContext(SearchContext)
