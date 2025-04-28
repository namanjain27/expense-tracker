import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Dashboard from './components/Dashboard'

const theme = createTheme()

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  )
}

export default App 