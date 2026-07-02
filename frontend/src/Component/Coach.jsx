import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { FiUser, FiActivity, FiPhone, FiAward, FiBook, FiDollarSign, FiCalendar } from 'react-icons/fi';

const INITIAL_STATE = {
  coachId: '',
  name: '',
  sportSpecialization: '',
  contact: '',
  experience: '',
  coachImage: '',
  qualification: '',
  salary: '',
  joiningDate: '',
  status: 'Active',
};

function CoachAdd() {
  const toast = useToast();
  const [addCoach, setAddCoach] = useState(() => {
    try {
      const saved = localStorage.getItem('coachFormDraft');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem('coachFormDraft', JSON.stringify(addCoach));
  }, [addCoach]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchNextId = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/coach/next-id', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setAddCoach(prev => ({ ...prev, coachId: result.nextId }));
      }
    } catch (err) {
      console.error('Error fetching next coach ID:', err);
    }
  };

  useEffect(() => {
    fetchNextId();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:4005/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Data })
        });
        const data = await res.json();
        if (data.success) {
          setAddCoach(prev => ({ ...prev, coachImage: data.url }));
          toast('Image uploaded successfully', 'success');
        } else {
          toast('Upload failed', 'error');
        }
      } catch (err) {
        toast('Failed to upload image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const tempErrors = {};
    if (!addCoach.name) {
      tempErrors.name = 'Full name is required';
    } else if (addCoach.name.trim().length < 3) {
      tempErrors.name = 'Name must be at least 3 characters';
    }

    if (!addCoach.sportSpecialization) {
      tempErrors.sportSpecialization = 'Sport specialization is required';
    }

    if (!addCoach.contact) {
      tempErrors.contact = 'Contact number is required';
    } else if (!/^\d{10}$/.test(addCoach.contact)) {
      tempErrors.contact = 'Contact must be a valid 10-digit number';
    }

    if (!addCoach.experience) {
      tempErrors.experience = 'Experience description is required';
    }

    if (!addCoach.qualification) {
      tempErrors.qualification = 'Qualification is required';
    }

    if (!addCoach.salary) {
      tempErrors.salary = 'Salary is required';
    } else if (Number(addCoach.salary) < 0) {
      tempErrors.salary = 'Salary cannot be negative';
    }

    if (!addCoach.joiningDate) {
      tempErrors.joiningDate = 'Joining date is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleCoach = (e) => {
    let { name, value } = e.target;
    if (name === 'contact') {
      value = value.replace(/\D/g, '');
    }
    setAddCoach((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const coachSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Unable to submit the form. Please check the highlighted fields and try again.', 'warning');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:4005/coach/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addCoach),
      });

      const result = await res.json();
      if (result.success) {
        toast('Coach added successfully!', 'success');
        setAddCoach(INITIAL_STATE);
        localStorage.removeItem('coachFormDraft');
        fetchNextId();
      } else {
        let msg = result.message || 'Failed to add coach';
        if (result.error && result.error.includes('E11000')) {
          if (result.error.includes('email')) msg = 'Email address already exists';
          else if (result.error.includes('contact')) msg = 'Contact number already exists';
          else msg = 'Record already exists';
        }
        toast(msg, 'error');
      }
    } catch (error) {
      toast('Server error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up overflow-x-hidden">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 sm:px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
            <FiUser />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-800">Add New Coach</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Register a trainer/coach to the academy roster</p>
          </div>
        </div>

        {/* Form Body */}
        <form className="p-6 sm:p-8 space-y-6" onSubmit={coachSubmit} id="coach-add-form" noValidate>
          
          {/* Coach Photo Upload */}
          <div className="flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-16 h-16 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
              {addCoach.coachImage ? (
                <img src={addCoach.coachImage} alt="Coach Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-600 uppercase">Coach Image</div>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {addCoach.coachImage && (
                  <button
                    type="button"
                    onClick={() => setAddCoach(prev => ({ ...prev, coachImage: '' }))}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Coach ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-id">Coach ID</label>
              <input
                id="coach-id"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-semibold cursor-not-allowed"
                type="text"
                name="coachId"
                placeholder="Auto-generating..."
                value={addCoach.coachId}
                disabled={true}
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-name">Full Name</label>
              <input
                id="coach-name"
                className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.name ? 'border-red-400' : 'border-gray-200'
                }`}
                type="text"
                name="name"
                placeholder="Coach full name"
                value={addCoach.name}
                onChange={handleCoach}
                disabled={loading}
              />
              {errors.name && <p className="text-[11px] font-semibold text-red-500">{errors.name}</p>}
            </div>

            {/* Sport Specialization */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-sport">Sport Specialization</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiActivity /></span>
                <input
                  id="coach-sport"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.sportSpecialization ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="text"
                  name="sportSpecialization"
                  placeholder="e.g. Cricket, Football, Tennis"
                  value={addCoach.sportSpecialization}
                  onChange={handleCoach}
                  disabled={loading}
                />
              </div>
              {errors.sportSpecialization && <p className="text-[11px] font-semibold text-red-500">{errors.sportSpecialization}</p>}
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-contact">Contact Number</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiPhone /></span>
                <input
                  id="coach-contact"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.contact ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="text"
                  name="contact"
                  placeholder="e.g. 9876543210"
                  value={addCoach.contact}
                  onChange={handleCoach}
                  disabled={loading}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                />
              </div>
              {errors.contact && <p className="text-[11px] font-semibold text-red-500">{errors.contact}</p>}
            </div>

            {/* Qualification */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-qual">Qualification</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiBook /></span>
                <input
                  id="coach-qual"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.qualification ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="text"
                  name="qualification"
                  placeholder="e.g. B.P.Ed, Certified Coach"
                  value={addCoach.qualification}
                  onChange={handleCoach}
                  disabled={loading}
                />
              </div>
              {errors.qualification && <p className="text-[11px] font-semibold text-red-500">{errors.qualification}</p>}
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-exp">Experience</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiAward /></span>
                <input
                  id="coach-exp"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.experience ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="text"
                  name="experience"
                  placeholder="e.g. 5 years"
                  value={addCoach.experience}
                  onChange={handleCoach}
                  disabled={loading}
                />
              </div>
              {errors.experience && <p className="text-[11px] font-semibold text-red-500">{errors.experience}</p>}
            </div>

            {/* Salary */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-salary">Monthly Salary (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiDollarSign /></span>
                <input
                  id="coach-salary"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.salary ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="number"
                  name="salary"
                  placeholder="e.g. 35000"
                  value={addCoach.salary}
                  onChange={handleCoach}
                  disabled={loading}
                  min="0"
                />
              </div>
              {errors.salary && <p className="text-[11px] font-semibold text-red-500">{errors.salary}</p>}
            </div>

            {/* Joining Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-joining">Joining Date</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 text-sm"><FiCalendar /></span>
                <input
                  id="coach-joining"
                  className={`w-full pl-9 pr-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer ${
                    errors.joiningDate ? 'border-red-400' : 'border-gray-200'
                  }`}
                  type="date"
                  name="joiningDate"
                  value={addCoach.joiningDate}
                  onChange={handleCoach}
                  disabled={loading}
                />
              </div>
              {errors.joiningDate && <p className="text-[11px] font-semibold text-red-500">{errors.joiningDate}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="coach-status">Status</label>
              <select
                id="coach-status"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                name="status"
                value={addCoach.status}
                onChange={handleCoach}
                disabled={loading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 border-t border-gray-100">
            <button
              id="coach-reset-btn"
              type="button"
              className="px-6 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm font-bold rounded-xl transition-all cursor-pointer text-center"
              onClick={() => {
                setAddCoach(INITIAL_STATE);
                localStorage.removeItem('coachFormDraft');
                setErrors({});
                fetchNextId();
              }}
              disabled={loading}
            >
              Reset
            </button>
            <button
              id="coach-submit-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all disabled:opacity-55 cursor-pointer flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />}
              {loading ? 'Saving...' : 'Save Coach'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default CoachAdd;
