import { Link } from 'react-router-dom'
import { Scale, Shield, FileSearch, Clock, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import DemoSection from '../components/DemoSection'

export default function LandingPage() {
  const features = [
    {
      icon: FileSearch,
      title: 'Smart Document Analysis',
      description: 'AI-powered analysis of legal documents with instant summaries and key clause identification.'
    },
    {
      icon: Shield,
      title: 'Risk Detection',
      description: 'Automatically identify risky clauses and potential legal issues in contracts.'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce document review time by up to 80% with intelligent automation.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Scale className="h-16 w-16 text-gold-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              India's Best Legal AI Assistant
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your legal practice with AI-powered document analysis, 
              contract review, and intelligent legal insights designed for Indian law firms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#demo" className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-8 py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2">
                <span>Try Demo</span>
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/login" className="bg-transparent border-2 border-white hover:bg-white hover:text-navy-900 px-8 py-3 rounded-lg font-semibold transition">
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-navy-900 mb-12">
            Why Choose Legal AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-gold-600" />
                </div>
                <h3 className="text-xl font-semibold text-navy-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="demo">
        <DemoSection />
      </div>

      <footer className="bg-navy-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scale className="h-6 w-6 text-gold-400" />
            <span className="font-bold">Legal AI Workspace</span>
          </div>
          <p className="text-gray-400 text-sm">
            Empowering Indian legal professionals with AI-driven insights.
          </p>
        </div>
      </footer>
    </div>
  )
}
