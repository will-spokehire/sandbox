import { Suspense } from 'react';
import { AcceptTermsForm } from '~/components/auth/AcceptTermsForm';

/**
 * Accept Terms & Conditions Page
 * 
 * Required page for users who haven't accepted T&Cs and Privacy Policy yet.
 * Users are redirected here after successful OTP verification if they haven't accepted.
 */
export default function AcceptTermsPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 md:px-[30px] py-[41px]">
      <div className="w-full max-w-[808px] flex flex-col items-center gap-20 md:gap-[80px]">
        <Suspense fallback={<AcceptTermsFormSkeleton />}>
          <AcceptTermsForm />
        </Suspense>
      </div>
    </div>
  );
}

function AcceptTermsFormSkeleton() {
  return (
    <div className="w-full max-w-[808px] flex flex-col items-center gap-[80px]">
      <div className="w-full flex flex-col items-center gap-[11px] animate-pulse">
        <div className="h-[96px] md:h-[96px] w-3/4 bg-slate-200 rounded" />
        <div className="h-5 w-full max-w-md bg-slate-200 rounded" />
      </div>
      <div className="w-full max-w-[480px] space-y-10">
        <div className="h-32 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Accept Terms - SpokeHire',
  description: 'Review and accept SpokeHire terms and privacy policy',
};

