import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })

  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isLogin
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register'

      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { ...formData, role }

      const { data } = await axios.post(url, payload)

      // Save token and user info to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }))

      // Redirect based on role
      if (data.role === 'patient') navigate('/patient/dashboard')
      else if (data.role === 'doctor') navigate('/doctor/dashboard')
      else if (data.role === 'admin') navigate('/admin/dashboard')

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 via-white to-medical-100 p-4 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-medical-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-medical-300 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-medical-100 p-8 border border-medical-100 relative z-10">

        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-medical-400 to-medical-600 rounded-2xl flex items-center justify-center shadow-lg shadow-medical-200 mb-4">
            <span className="text-white text-2xl">🏥</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isLogin ? 'Welcome Back 👋' : 'Create Account ✨'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 text-center">
            {isLogin
              ? 'Log in to your healthcare portal'
              : 'Sign up to manage your appointments'}
          </p>
        </div>

        {/* Role selector */}
        {!isLogin && (
          <div className="flex bg-medical-50 p-1 rounded-2xl mb-6 gap-1">
            {['patient', 'doctor', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all duration-200 ${
                  role === r
                    ? 'bg-white text-medical-600 shadow-sm shadow-medical-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {r === 'patient' ? '🧑 Patient' : r === 'doctor' ? '👨‍⚕️ Doctor' : '⚙️ Admin'}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Priya Sharma"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="priya@example.com"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all"
              />
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <span className="text-xs text-medical-500 hover:text-medical-600 cursor-pointer font-medium">
                Forgot Password?
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-medical-200 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Get Started'}
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle login/register */}
        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-medical-500 font-semibold hover:text-medical-600"
          >
            {isLogin ? 'Register here' : 'Sign in here'}
          </button>
        </div>

      </div>
    </div>
  )
}