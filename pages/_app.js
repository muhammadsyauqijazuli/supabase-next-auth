import '../styles/globals.css'
import Footer from '../components/Footer'

export default function App({ Component, pageProps }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Component {...pageProps} />
      </div>
      <Footer />
    </div>
  )
}