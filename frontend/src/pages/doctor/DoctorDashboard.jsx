import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/api'

export default function DoctorDashboard() {
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [rawDoctorNotes, setRawDoctorNotes] = useState('')
  const [prescribeLoading, setPrescribeLoading] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('user') || 'null')
    if (!loggedUser) {
      navigate('/login')
    } else {
      setUser(loggedUser)
      fetchAppointments()
    }
  }, [navigate])

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await API.get('/appointments/doctor')
      setAppointments(data.appointments || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Could not fetch doctor appointments dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault()
    if (!rawDoctorNotes.trim()) {
      setError('Notes cannot be empty.')
      return
    }

    setPrescribeLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      await API.post(`/appointments/${selectedAppointment._id}/prescription`, {
        rawDoctorNotes
      })
      setSuccessMsg('Prescription generated via Gemini AI and saved successfully!')
      setRawDoctorNotes('')
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit prescription.')
    } finally {
      setPrescribeLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
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
            <p className="text-xs font-semibold text-slate-400">Doctor Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700">Dr. {user?.name}</p>
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

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Your Consultations Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">Review scheduled appointments, clinical AI symptoms data, and submit digital prescriptions.</p>
          </div>
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 transition-all text-xs"
          >
            🔄 Refresh List
          </button>
        </div>

        {/* Global Messages */}
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

        {/* Dashboard Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="animate-spin text-3xl">⏳</span>
            <p className="text-slate-400 text-sm font-medium">Loading consultations...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-slate-700">No appointments scheduled</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              Any patient bookings scheduled with you will display here automatically, including AI summary data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {appointments.map((app) => (
              <div 
                key={app._id} 
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Left Section: Patient & Symptoms */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">🧑 Patient: {app.patient?.name}</span>
                    <span className="text-xs text-slate-400">({app.patient?.email} | {app.patient?.phone || 'No phone'})</span>
                    <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${
                      app.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-medblue-50 text-medblue-700 border-medblue-100'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{app.appointmentDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Slot</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{app.slotTime}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Symptom Log</p>
                    <p className="text-sm text-slate-600 mt-1 italic">"{app.symptoms}"</p>
                  </div>
                </div>

                {/* Middle Section: AI Summary details */}
                <div className="flex-1 bg-gradient-to-br from-medical-50/50 to-medblue-50/30 border border-medical-100/50 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-medical-100/30 pb-2">
                      <span className="text-xs font-bold text-medical-600 flex items-center gap-1">✨ Gemini AI Intake Summary</span>
                      {app.preVisitSummary && (
                        <span className={`text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full border ${getUrgencyBadge(app.preVisitSummary.urgencyLevel)}`}>
                          {app.preVisitSummary.urgencyLevel || 'Low'} Urgency
                        </span>
                      )}
                    </div>
                    {app.preVisitSummary ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-600">
                          <span className="font-bold text-slate-700">Chief Complaint:</span> {app.preVisitSummary.chiefComplaint}
                        </p>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Suggested Intake Questions</p>
                          <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                            {app.preVisitSummary.suggestedQuestions?.map((q, i) => (
                              <li key={i} className="leading-snug">{q}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No symptoms processing summary available.</p>
                    )}
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex flex-col justify-center items-stretch md:w-56 gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {app.status === 'booked' ? (
                    <button
                      onClick={() => {
                        setSelectedAppointment(app)
                        setRawDoctorNotes('')
                      }}
                      className="bg-gradient-to-r from-medical-500 to-medblue-500 hover:from-medical-600 hover:to-medblue-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      ✏️ Write Prescription
                    </button>
                  ) : app.status === 'completed' && app.prescriptionData ? (
                    <button
                      onClick={() => setSelectedPrescription(app.prescriptionData)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📄 View AI Digital Rx
                    </button>
                  ) : (
                    <span className="text-xs text-center text-slate-400 italic font-semibold">No Actions Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Prescription Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedAppointment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
              disabled={prescribeLoading}
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Submit Clinical Notes</h3>
                <p className="text-xs text-slate-400">For Patient: {selectedAppointment.patient?.name}</p>
              </div>
            </div>

            <form onSubmit={handlePrescribeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Doctor's Shorthand / Raw Clinical Notes
                </label>
                <textarea
                  value={rawDoctorNotes}
                  onChange={(e) => setRawDoctorNotes(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg tid x7d. Take with food. Avoid dairy. Rest well. Call if rash occurs."
                  className="w-full h-44 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all resize-none"
                  required
                  disabled={prescribeLoading}
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  ✨ Gemini AI will parse your shorthand notes into structured medical items (dosage, timing, duration) and generate plain-language patient explanations with drug warnings automatically.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all"
                  disabled={prescribeLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prescribeLoading}
                  className="flex-1 bg-gradient-to-r from-medical-500 to-medblue-500 hover:from-medical-600 hover:to-medblue-600 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {prescribeLoading ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Processing AI Rx...</span>
                    </>
                  ) : (
                    <span>Submit & Format</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedPrescription(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <span className="text-3xl">📄</span>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Digital AI Rx Prescription</h3>
                <p className="text-xs text-slate-400">Processed by Gemini AI Clinical Suite</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Doctor Raw notes */}
              <div>
                <h4 className="text-xs uppercase text-slate-400 font-bold tracking-wide">Your Raw Notes</h4>
                <p className="text-xs text-slate-500 mt-1 italic p-2 bg-slate-50 border border-slate-100 rounded-lg">"{selectedPrescription.rawDoctorNotes}"</p>
              </div>

              {/* Chief Complaint Confirmation */}
              <div>
                <h4 className="text-xs uppercase text-slate-400 font-bold tracking-wide">Diagnosis / Clinical Focus</h4>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{selectedPrescription.formattedPrescription?.chiefComplaintConfirmation}</p>
              </div>

              {/* Medications */}
              <div>
                <h4 className="text-xs uppercase text-slate-400 font-bold tracking-wide mb-2">Prescribed Medications</h4>
                <div className="space-y-2">
                  {selectedPrescription.formattedPrescription?.medications?.map((med, i) => (
                    <div key={i} className="bg-medblue-50/50 border border-medblue-100/50 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-800">💊 {med.name}</span>
                        <span className="text-xs bg-medical-50 text-medical-600 font-bold px-2 py-0.5 rounded-full">{med.duration}</span>
                      </div>
                      <p className="text-xs text-slate-600"><span className="font-semibold text-slate-400">Dosage:</span> {med.dosage}</p>
                      <p className="text-xs text-slate-600"><span className="font-semibold text-slate-400">Timing:</span> {med.timing}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Notes */}
              <div>
                <h4 className="text-xs uppercase text-slate-400 font-bold tracking-wide">Patient Care Instructions</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3 italic">"{selectedPrescription.formattedPrescription?.patientNotes}"</p>
              </div>

              {/* Safety Warnings */}
              {selectedPrescription.formattedPrescription?.safetyWarnings && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <h4 className="text-xs uppercase text-rose-500 font-bold tracking-wide flex items-center gap-1">⚠️ Crucial Safety Warnings</h4>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">{selectedPrescription.formattedPrescription.safetyWarnings}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedPrescription(null)}
              className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
            >
              Close Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
