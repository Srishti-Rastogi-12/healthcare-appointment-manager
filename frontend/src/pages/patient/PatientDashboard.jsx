import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../utils/api'

export default function PatientDashboard() {
  const [user, setUser] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [activeTab, setActiveTab] = useState('appointments') // 'appointments' or 'book'
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('user') || 'null')
    if (!loggedUser) {
      navigate('/login')
    } else {
      setUser(loggedUser)
      fetchDoctors()
      fetchAppointments()
    }
  }, [navigate])

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchAvailableSlots()
    } else {
      setAvailableSlots([])
      setSelectedSlot('')
    }
  }, [selectedDoctorId, selectedDate])

  const fetchDoctors = async () => {
    try {
      const { data } = await API.get('/doctors')
      setDoctors(data)
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setError('Could not load doctors list.')
    }
  }

  const fetchAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const { data } = await API.get('/appointments/patient')
      setAppointments(data.appointments || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Could not load your appointments.')
    } finally {
      setLoadingAppointments(false)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const { data } = await API.get(`/slots/available?doctorId=${selectedDoctorId}&date=${selectedDate}`)
      setAvailableSlots(data.slots || [])
      setSelectedSlot('')
    } catch (err) {
      console.error('Error fetching slots:', err)
      setError('Could not load available time slots.')
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!selectedDoctorId || !selectedDate || !selectedSlot || !symptoms) {
      setError('Please fill in all booking fields.')
      return
    }

    setBookingLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      await API.post('/appointments', {
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        slotTime: selectedSlot,
        symptoms
      })

      setSuccessMsg('Appointment booked successfully! Calendar synced & confirmation email sent.')
      setSymptoms('')
      setSelectedDoctorId('')
      setSelectedDate('')
      setSelectedSlot('')
      fetchAppointments()
      setActiveTab('appointments')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.')
    } finally {
      setBookingLoading(false)
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
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-medical-100 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-medical-400 to-medblue-400 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-xl">🏥</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">CareSync</h1>
            <p className="text-xs font-semibold text-slate-400">Patient Portal</p>
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

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-4 px-2 font-bold text-sm transition-all relative ${
              activeTab === 'appointments'
                ? 'text-medical-600 border-b-2 border-medical-500'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            📅 My Appointments
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`pb-4 px-2 font-bold text-sm transition-all relative ${
              activeTab === 'book'
                ? 'text-medical-600 border-b-2 border-medical-500'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ➕ Book Appointment
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl px-5 py-4 mb-6 relative flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold text-rose-500 hover:text-rose-700">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-5 py-4 mb-6 relative flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* Tab Contents */}
        {activeTab === 'appointments' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Your Appointment History</h2>
              <button 
                onClick={fetchAppointments}
                className="p-2 text-slate-400 hover:text-medblue-500 rounded-lg hover:bg-slate-100 transition-all"
                title="Reload"
              >
                🔄 Reload
              </button>
            </div>

            {loadingAppointments ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="animate-spin text-3xl">⏳</span>
                <p className="text-slate-400 text-sm font-medium">Fetching clinical details...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🗓️</div>
                <h3 className="text-lg font-bold text-slate-700">No appointments scheduled</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                  Keep track of your health journey. Schedule your first medical checkup today.
                </p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="mt-6 bg-gradient-to-r from-medical-500 to-medblue-500 hover:from-medical-600 hover:to-medblue-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-medical-100 text-sm"
                >
                  Schedule Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map((app) => (
                  <div 
                    key={app._id} 
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-medical-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Date & Time */}
                      <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🗓️</span>
                          <span className="text-sm font-bold text-slate-700">{app.appointmentDate}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">{app.slotTime}</span>
                        </div>
                        <span className={`text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border ${
                          app.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : app.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : 'bg-medblue-50 text-medblue-700 border-medblue-100'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      {/* Doctor Details */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Doctor Assigned</p>
                        <p className="text-sm font-bold text-slate-800">Dr. {app.doctor?.name || 'Unassigned'}</p>
                        <p className="text-xs text-slate-500">{app.doctor?.email}</p>
                      </div>

                      {/* Symptoms */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Reported Symptoms</p>
                        <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl p-3 border border-slate-100 mt-1">"{app.symptoms}"</p>
                      </div>

                      {/* AI Summary Section */}
                      {app.preVisitSummary && (
                        <div className="bg-gradient-to-br from-medical-50/50 to-medblue-50/30 border border-medical-100/50 rounded-2xl p-4 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-medical-600 flex items-center gap-1">✨ AI Pre-Visit Analysis</span>
                            <span className={`text-[10px] font-extrabold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${getUrgencyBadge(app.preVisitSummary.urgencyLevel)}`}>
                              Urgency: {app.preVisitSummary.urgencyLevel || 'Low'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">
                            <span className="text-slate-400">Chief Complaint:</span> {app.preVisitSummary.chiefComplaint}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Prescriptions Actions */}
                    {app.status === 'completed' && app.prescriptionData && (
                      <button
                        onClick={() => setSelectedPrescription(app.prescriptionData)}
                        className="mt-5 w-full bg-gradient-to-r from-medblue-500 to-medblue-600 hover:from-medblue-600 hover:to-medblue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        📄 View AI Digital Prescription
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Booking Page */
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Schedule a Medical Consultation</h2>
            <p className="text-sm text-slate-400 mb-6">Select a specialist and available slot. Your clinical symptoms will be pre-analyzed by Gemini AI.</p>

            <form onSubmit={handleBooking} className="space-y-6">
              
              {/* Doctor Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Specialist</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                  required
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.user?._id}>
                      Dr. {doc.user?.name} - {doc.specialization} (${doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              {/* Slot Input */}
              {selectedDoctorId && selectedDate && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Slots</label>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-rose-500 font-bold bg-rose-50 border border-rose-100 rounded-xl p-3">No available slots on this date. Doctor may be on leave or fully booked.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                            selectedSlot === slot
                              ? 'bg-medblue-500 text-white border-medblue-500 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Symptoms Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Describe Symptoms / Primary Concern</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your concerns. (e.g. Dry cough and fever since 2 days, moderate chest tightness...)"
                  className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-medical-400 focus:bg-white transition-all resize-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  ✨ Real-time AI processing enabled. Gemini will generate structured pre-visit intake metrics.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingLoading || !selectedSlot}
                className="w-full bg-gradient-to-r from-medical-500 to-medblue-500 hover:from-medical-600 hover:to-medblue-600 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-medical-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    <span>Analyzing symptoms & Syncing Google calendar...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Appointment Booking</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
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
