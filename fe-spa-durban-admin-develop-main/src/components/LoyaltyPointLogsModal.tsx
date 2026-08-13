import { useState } from 'react';
import ATMCircularProgress from 'src/components/atoms/ATMCircularProgress/ATMCircularProgress';

type LoyaltyPointLog = {
  _id: string;
  newPoints: number;
  reason: string;
  changedBy:string;
  changedAt: string;
};

type LoyaltyPointLogsModalProps = {
  open: boolean;
  onClose: () => void;
  customer: any;
  logs: LoyaltyPointLog[];
  isLoading?: boolean;
};

const LoyaltyPointLogsModal = ({
  open,
  onClose,
  customer,
  logs,
  isLoading = false,
}: LoyaltyPointLogsModalProps) => {
  if (!open) return null;

  // Sort logs by changedAt descending (newest first)
  const sortedLogs = [...(logs || [])].sort(
    (a, b) =>
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg w-full max-w-[580px] max-h-[80vh] flex flex-col shadow-xl">

        {/* Header – ultra compact */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div>
            <h2 className="text-sm font-semibold text-[#3f352d]">
              Loyalty Point Logs
            </h2>
            <p className="text-[11px] text-gray-500">
              {customer?.customerName || '-'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-base"
          >
            ×
          </button>
        </div>

        {/* Current Points – ultra compact */}
        <div className="px-3 py-1.5 bg-gray-50 border-b">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Current Points</span>
            <span className="font-semibold text-[#006972] text-sm">
              {customer?.loyaltyPoints || 0}
            </span>
          </div>
        </div>

        {/* Logs – ultra compact */}
        <div className="overflow-y-auto px-3 py-1.5">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <ATMCircularProgress />
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">
              No history found.
            </div>
          ) : (
            <div className="border rounded overflow-hidden">

              {/* Table Header – ultra compact */}
              <div className="grid grid-cols-[65px_1fr_110px_110px] bg-gray-100 px-1.5 py-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                <div>Points</div>
                <div>Reason</div>
                {/* <div>Changed By</div> */}
                <div>Date</div>
              </div>

              {/* Rows – ultra compact */}
              {sortedLogs.map((log) => (
                <div
                  key={log._id}
                  className="grid grid-cols-[65px_1fr_110px_110px] px-1.5 py-1.5 border-t items-center text-[11px]"
                >
                  {/* Points */}
                  <div
                    className={`font-semibold ${
                      log.newPoints >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {log.newPoints >= 0 ? '+' : ''}
                    {log.newPoints}
                  </div>

                  {/* Reason */}
                  <div className="text-gray-700 truncate pr-1">
                    {log.reason || '-'}
                  </div>

                  {/* Changed By */}
                  {/* <div className="text-gray-600 truncate">
                    {log.changedBy?. || '-'}
                  </div> */}

                  {/* Date – show full date+time for clarity */}
                  <div className="text-gray-500 text-[10px]">
                    {log.changedAt
                      ? new Date(log.changedAt).toLocaleString()
                      : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer – ultra compact */}
        <div className="flex justify-end px-3 py-1.5 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPointLogsModal;