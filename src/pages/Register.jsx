import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus, Home, Building2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState(null); // No default - force user to select
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    // Validate user type is selected
    if (!userType) {
      toast.error('Please select whether you are a tenant or landlord');
      return;
    }

    setIsLoading(true);
    try {
      // Ensure user_type is included in the data
      const registrationData = {
        ...data,
        user_type: userType
      };

      const result = await registerUser(registrationData);
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        const errorMsg = result.error?.email?.[0] || result.error?.detail || 'Registration failed';
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">
                Create Your Account
              </h1>
              <p className="text-dark-600">Join RentStay and find your perfect home</p>
            </div>

            {/* User Type Selection */}
            <div className="mb-8">
              <label className="label text-center block mb-3">
                Select Account Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('tenant')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  userType === 'tenant'
                    ? 'border-primary bg-primary-50 shadow-md'
                    : userType === null
                    ? 'border-gray-300 hover:border-primary-300 bg-white'
                    : 'border-gray-200 hover:border-primary-200 bg-gray-50'
                }`}
              >
                <Home className={`mx-auto mb-2 ${userType === 'tenant' ? 'text-primary' : 'text-dark-400'}`} size={32} />
                <h3 className="font-semibold text-dark-900">I'm a Tenant</h3>
                <p className="text-sm text-dark-600 mt-1">Looking for a property</p>
              </button>

              <button
                type="button"
                onClick={() => setUserType('landlord')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  userType === 'landlord'
                    ? 'border-primary bg-primary-50 shadow-md'
                    : userType === null
                    ? 'border-gray-300 hover:border-primary-300 bg-white'
                    : 'border-gray-200 hover:border-primary-200 bg-gray-50'
                }`}
              >
                <Building2 className={`mx-auto mb-2 ${userType === 'landlord' ? 'text-primary' : 'text-dark-400'}`} size={32} />
                <h3 className="font-semibold text-dark-900">I'm a Landlord</h3>
                <p className="text-sm text-dark-600 mt-1">List and manage properties</p>
                <p className="text-xs text-dark-500 mt-2">Complete verification to access all features</p>
              </button>
              </div>
              {userType === null && (
                <p className="text-sm text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                  <span className="font-semibold">⚠️</span>
                  Please select your account type to continue
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                    <input
                      type="text"
                      {...register('first_name', { required: 'First name is required' })}
                      className="input pl-10"
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                    <input
                      type="text"
                      {...register('last_name', { required: 'Last name is required' })}
                      className="input pl-10"
                      placeholder="Doe"
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="input pl-10"
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                  <input
                    type="tel"
                    {...register('phone_number', {
                      pattern: {
                        value: /^[0-9+()-\s]+$/,
                        message: 'Invalid phone number'
                      }
                    })}
                    className="input pl-10"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    className="input pl-10 pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('password_confirm', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    className="input pl-10 pr-10"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password_confirm && (
                  <p className="text-red-500 text-sm mt-1">{errors.password_confirm.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <span>Creating account...</span>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-dark-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-600 font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
