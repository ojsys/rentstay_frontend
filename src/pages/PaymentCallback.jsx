import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const ref = params.get('reference') || params.get('trxref');
    if (!ref) {
      setStatus('failed');
      setMessage('Missing payment reference.');
      return;
    }

    const verify = async () => {
      try {
        await paymentAPI.verifyPayment(ref);
        setStatus('success');
        setMessage('Payment verified successfully!');
        setTimeout(() => navigate('/dashboard'), 1200);
      } catch (err) {
        setStatus('failed');
        setMessage(err?.response?.data?.detail || 'Payment verification failed.');
      }
    };

    verify();
  }, [params, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card text-center max-w-md w-full">
        {status === 'verifying' && <Loader2 className="mx-auto mb-3 animate-spin text-primary" size={36} />}
        {status === 'success' && <CheckCircle2 className="mx-auto mb-3 text-green-600" size={36} />}
        {status === 'failed' && <XCircle className="mx-auto mb-3 text-red-600" size={36} />}
        <h1 className="text-2xl font-display font-bold mb-2">Payment Status</h1>
        <p className="text-dark-600">{message}</p>
        {status !== 'verifying' && (
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-6">Go to Dashboard</button>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;

