import React,{ useState, useEffect} from 'react';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import progressService from '../../services/progressService';
import { Link } from 'react-router-dom';
import { FileText,BookOpen, TrendingUp, Clock} from 'lucide-react';

const DashboardPage = () => {

 const [ dashboardData, setDashboardData ] = useState(null);
 const [loading, setLoading ] = useState(true);

 useEffect( () => {
 
  const fetchDashboardData = async () => {
     try {
        const data = await progressService.getDashboardData();
        console.log("Data___getDashboardData", data);
      
        setDashboardData(data.data);
      }
      catch (error){
         toast.error('Failed to fetch dashboard data.')
         console.error(error);
      }
      finally{
        setLoading(false);
      }
};
    fetchDashboardData();
},[]);
  

if(loading)
{

  return <Spinner />;
}

if(!dashboardData || !dashboardData.overview){
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center  w-16 h-16 rounded-2xl bg-slate-100 mb-4">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 text-sm">No dashboard data availablle.</p>
      </div>
    </div>
  );
}


const stats= [
  {
    label: 'Total Notes',
    to: '/documents',
    value: dashboardData.overview.totalNotes ?? 0,
    icon: FileText,
    gradient: 'from-blue-400 to-cyan-500',
    shadowColor:'shadow-blue-500/25'
  },
  {
    label:'Total Mock Test',
    to: '/mock-test',
    value: dashboardData.overview.totalMockTest ?? 0,
    icon: BookOpen,
    gradient: 'from-purple-400 to-pink-500',
    shadowColor: 'shadow-purple-500/25'
  },
  
  
  {  label: 'Total Quiz',
    value: dashboardData.overview.totalQuiz ?? 0,
    icon: BookOpen,
    gradient: 'from-emerald-400 to-teal-500',
    shadowColor: 'shadow-emerald-500/25'}
  
];


  return (
    <div className="min-h-screen relative bg-slate-50/50">
      
      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-slate-500 text-base">
            Track your learning progress and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Card = stat.to ? Link : 'div';
            return (
            <Card
              key={index}
              {...(stat.to ? { to: stat.to } : {})}
              className={`${stat.to ? 'block cursor-pointer ' : ''}group relative bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden`}
            >
              {/* Subtle top hover highlight */}
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor} flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                </div>
                <div className="text-4xl font-bold text-slate-900 tracking-tight mt-4">
                  {stat.value}
                </div>
              </div>
            </Card>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <Clock className="w-5 h-5 text-slate-500" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              Recent Activity
            </h3>
          </div>

          {/* Fixed Ternary Operator Structure */}
          {dashboardData.recentActivity && (dashboardData.recentActivity.documents?.length > 0 || dashboardData.recentActivity.quizzes?.length > 0 || dashboardData.recentActivity.mockTests?.length > 0) ? (
            <div className="space-y-3">
              {[
                ...(dashboardData.recentActivity.documents || []).map(doc => ({
                  id: doc._id,
                  description: doc.title,
                  timestamp: doc.lastAccessed,
                  link: `/documents/${doc._id}`,
                  type: 'document'
                })),
                ...(dashboardData.recentActivity.quizzes || []).map(quiz => ({
                  id: quiz._id,
                  description: quiz.title,
                  timestamp: quiz.completedAt || quiz.createdAt,
                  link: `/quizzes/${quiz._id}`,
                  type: 'quiz'
                })),
                ...(dashboardData.recentActivity.mockTests || []).map(test => ({
                  id: test._id,
                  description: test.documentTitle || test.title,
                  timestamp: test.submittedAt || test.createdAt,
                  link: `/mock-test/${test._id}/result`,
                  type: 'mockTest'
                }))
              ]
                .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
                .map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                          activity.type === 'document'
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                            : activity.type === 'mockTest'
                            ? 'bg-gradient-to-r from-purple-400 to-pink-500'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                        }`} />
                        <p className="text-sm font-medium text-slate-600 truncate">
                          {activity.type === 'document'
                            ? 'Accessed Document: '
                            : activity.type === 'mockTest'
                            ? 'Took Mock Test: '
                            : 'Attempted Quiz: '}
                          <span className="text-slate-900 font-semibold">{activity.description}</span>
                        </p>
                      </div>
                      <p className="text-xs font-medium text-slate-400 pl-[22px]">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {activity.link && (
                      <a
                        href={activity.link}
                        className="ml-4 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-200 shadow-sm"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            /* The "No Activity" Empty State */
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-base font-medium text-slate-900 mb-1">No recent activity yet.</h4>
              <p className="text-sm text-slate-500">Start learning to see your progress here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

