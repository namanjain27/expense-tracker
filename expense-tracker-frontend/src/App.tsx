import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import LandingPage from './components/LandingPage'

const theme = createTheme()

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LandingPage />
    </ThemeProvider>
  )
}

export default App 