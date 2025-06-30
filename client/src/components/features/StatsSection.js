import React from 'react';
import StatsCard from './StatsCard';
import { Users, Activity, CheckCircle, Send } from 'lucide-react';

const StatsSection = () => {
  return (
    <div className="relative w-full bg-gradient-to-b from-secondary-900 to-secondary-800 py-16">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="bg-particle w-32 h-32 rounded-full opacity-10 absolute top-1/4 left-1/4" />
        <div className="bg-particle w-24 h-24 rounded-full opacity-10 absolute top-1/3 right-1/4" />
        <div className="bg-particle w-40 h-40 rounded-full opacity-10 absolute bottom-1/4 left-1/3" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Thống Kê Hoạt Động</h2>
          <p className="text-secondary-300 max-w-2xl mx-auto">
            Theo dõi các chỉ số quan trọng về hoạt động của hệ thống và cộng đồng
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={Users}
            value="1247+"
            label="Người dùng hoạt động"
            color="primary"
          />
          <StatsCard
            icon={Activity}
            value="89%"
            label="Độ chính xác"
            color="accent"
          />
          <StatsCard
            icon={CheckCircle}
            value="15k+"
            label="Bài viết đã kiểm tra"
            color="primary"
          />
          <StatsCard
            icon={Send}
            value="2.5k+"
            label="Báo cáo mới"
            color="accent"
          />
        </div>
      </div>
    </div>
  );
};

export default StatsSection; 