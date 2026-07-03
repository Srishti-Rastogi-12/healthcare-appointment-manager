import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/api'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [doctorUsers, setDoctorUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  // Form fields for doctor profile
  const [specialization, setSpecialization] = useState('')
  const [startHour, setStartHour] = useState('09:00')
  const [endHour, setEndHour] = useState('17:00')
  const [slotDuration, setSlotDuration] = useState(30)
  const [leaveDaysStr, setLeaveDaysStr] = useState('')
  const [bio, setBio] = useState('')
  const [experience, setExperience] = useState(5)
  const [consultationFee, setConsultationFee] = useState(100)
  const [isAvailable, setIsAvailable] = useState(true)

  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('user') || 'null')
    if (!loggedUser) {
      navigate('/login')
    } else {
      setUser(loggedUser)
      fetchDoctorUsers()
    }
  }, [navigate])

  const fetchDoctorUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await API.get('/auth/doctors')
      setDoctorUsers(data || [])
    } catch (err) {
      console.error('Error fetching doctor users:', err)
      setError('Could not load registered doctor users.')
    } finally {
      setLoading(false)
    }
  }

  // Load existing profile details if doctor is selected
  const handleDoctorChange = async (userId) => {
    setSelectedUserId(userId)
    setError('')
    setSuccessMsg('')
    if (!userId) {
      clearForm()
      return
    }

    try {
      // Find if doctor profile exists by checking patient list of doctors
      const { data } = await API.get('/doctors')
      const doctorProfile = data.find((doc) => doc.user?._id === userId)
      
      if (doctorProfile) {
        setSpecialization(doctorProfile.specialization || '')
        setStartHour(doctorProfile.workingHours?.start || '09:00')
        setEndHour(doctorProfile.workingHours?.end || '17:00')
        setSlotDuration(doctorProfile.slotDuration || 30)
        setLeaveDaysStr(doctorProfile.leaveDays?.join(', ') || '')
        setBio(doctorProfile.bio || '')
        setExperience(doctorProfile.experience || 0)
        setConsultationFee(doctorProfile.consultationFee || 0)
        setIsAvailable(doctorProfile.isAvailable ?? true)
      } else {
        // No profile exists yet
        clearForm()
      }
    } catch (err) {
      console.error('Error loading doctor profile detail:', err)
      setError('Could not fetch existing doctor profile.')
    }
  }

  const clearForm = () => {
    setSpecialization('')
    setStartHour('09:00')
    setEndHour('17:00')
    setSlotDuration(30)
    setLeaveDaysStr('')
    setBio('')
    setExperience(5)
    setConsultationFee(100)
    setIsAvailable(true)
  }

  const handleSubmitProfile = async (e) => {
    e.preventDefault()
    if (!selectedUserId) {
      setError('Please select a doctor to configure.')
      return
    }
    if (!specialization) {
      setError('Please enter specialization.')
      return
    }

    setSaving(true)
    setError('')
    setSuccessMsg('')

    // Parse leave days from comma-separated string
    const leaveDays = leaveDaysStr
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d !== '')

    try {
      await API.post('/doctors/profile', {
        userId: selectedUserId,
        specialization,
        workingHours: {
          start: startHour,
          end: endHour
        },
        slotDuration: Number(slotDuration),
        leaveDays,
        bio,
        experience: Number(experience),
        consultationFee: Number(consultationFee),
        isAvailable
      })

      setSuccessMsg('Doctor profile saved successfully! Available slots updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doctor profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-medblue-50">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-medical-100 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medblue-400 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-xl">🏥</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">CareSync</h1>
            <p className="text-xs font-semibold text-slate-400">Admin Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configure Doctor Metadata & Schedules</h2>
          <p className="text-sm text-slate-400 mt-1">Select a registered doctor user, define their working shifts, block leaves, and set consultation fees.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold text-rose-500 hover:text-rose-700">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="animate-spin text-2xl">⏳</span>
              <p className="text-slate-400 text-sm">Loading doctors...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitProfile} className="space-y-6">
              
              {/* Doctor User Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Registered Doctor User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-semibold"
                  required
                >
                  <option value="">-- Select a Doctor User --</option>
                  {doctorUsers.map((docUser) => (
                    <option key={docUser._id} value={docUser._id}>
                      {docUser.name} ({docUser.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Specialization */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specialization</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Cardiologist, General Physician"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    {/* Consultation Fee */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Consultation Fee ($)</label>
                      <input
                        type="number"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        placeholder="100"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Shift Start */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shift Start (HH:MM)</label>
                      <input
                        type="text"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        placeholder="09:00"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    {/* Shift End */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shift End (HH:MM)</label>
                      <input
                        type="text"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        placeholder="17:00"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    {/* Slot Duration */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Slot Duration (Mins)</label>
                      <input
                        type="number"
                        value={slotDuration}
                        onChange={(e) => setSlotDuration(e.target.value)}
                        placeholder="30"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Experience */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="5"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    {/* Is Available Toggle */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Availability</label>
                      <div className="flex items-center gap-3 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4">
                        <input
                          type="checkbox"
                          id="isAvailable"
                          checked={isAvailable}
                          onChange={(e) => setIsAvailable(e.target.checked)}
                          className="w-4 h-4 accent-medical-500 cursor-pointer"
                        />
                        <label htmlFor="isAvailable" className="text-sm font-semibold text-slate-600 cursor-pointer">
                          Doctor is accepting active appointments
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Doctor Biography</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a brief professional bio..."
                      className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  {/* Leave Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scheduled Leave Days (Comma-separated YYYY-MM-DD)</label>
                    <input
                      type="text"
                      value={leaveDaysStr}
                      onChange={(e) => setLeaveDaysStr(e.target.value)}
                      placeholder="e.g. 2026-07-10, 2026-07-15"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                      Slots on these leave dates will be automatically blocked, and no appointments can be scheduled on them.
                    </p>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-medical-500 to-medblue-500 hover:from-medical-600 hover:to-medblue-600 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-medical-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin text-lg">⏳</span>
                        <span>Saving profile metadata...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish Doctor Profile Configuration</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
