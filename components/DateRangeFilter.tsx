import React, { useState } from 'react';
import { Calendar, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  onClear: () => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  onClear
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange(newDate, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange(startDate, newDate);
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const setPresetRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    onDateRangeChange(startDate, endDate);
    setIsExpanded(false); // モバイルでプリセット選択後は閉じる
  };

  const hasDateFilter = startDate || endDate;

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('ja-JP')} ～ ${endDate.toLocaleDateString('ja-JP')}`;
    } else if (startDate) {
      return `${startDate.toLocaleDateString('ja-JP')} 以降`;
    } else if (endDate) {
      return `${endDate.toLocaleDateString('ja-JP')} 以前`;
    }
    return '期間で絞り込み';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-3">
      {/* コンパクトなヘッダー */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center min-w-0 flex-1">
          <Calendar className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">
            {formatDateRange()}
          </span>
        </div>
        <div className="flex items-center ml-2">
          {hasDateFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-gray-500 hover:text-red-500 transition-colors mr-2 p-1"
              title="期間フィルターをクリア"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* 展開可能なコンテンツ */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3">
          {/* プリセットボタン - モバイル最適化 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setPresetRange(7)}
              className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              過去7日
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              過去30日
            </button>
            <button
              onClick={() => setPresetRange(90)}
              className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              過去3ヶ月
            </button>
            <button
              onClick={() => setPresetRange(365)}
              className="px-2 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              過去1年
            </button>
          </div>
          
                    {/* 日付入力 - モバイル最適化 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">開始日</label>
              <input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={handleStartDateChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">終了日</label>
              <input
                type="date"
                value={formatDateForInput(endDate)}
                onChange={handleEndDateChange}
                min={startDate ? formatDateForInput(startDate) : undefined}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
