import { useDispatch } from 'react-redux';
import { TableHeader } from 'src/components/molecules/MOLTable/MOLTable';
import { AppDispatch } from 'src/store';
import { RewardsCoupon } from '../../models/RewardsCoupon.model';
import { setIsOpenAddDialog } from '../../slice/RewardsCouponSlice';
import RewardsCouponListing from './RewardsCouponListing';
import { useFilterPagination } from 'src/hooks/useFilterPagination';
import { useFetchData } from 'src/hooks/useFetchData';
import {
  useGetRewardsCouponsQuery,
  useRewardsCouponStatusMutation,
  useDeleteRewardsCouponMutation,
} from '../../service/RewardsCouponServices';
import ATMSwitch from 'src/components/atoms/FormElements/ATMSwitch/ATMSwitch';
import { useNavigate, useParams } from 'react-router-dom';
import { showToast } from 'src/utils/showToaster';
import ShowConfirmation from 'src/utils/ShowConfirmation';
import { format } from 'date-fns';
import { formatZonedDate } from 'src/utils/formatZonedDate';

type Props = {};

const RewardsCouponListingWrapper = (props: Props) => {
  const navigate = useNavigate();
  const [status] = useRewardsCouponStatusMutation();
  const [deleteRewardsCoupon] = useDeleteRewardsCouponMutation();
  const dispatch = useDispatch<AppDispatch>();
  const { searchQuery, limit, page } = useFilterPagination();

  // Fetch data with search
  const { data, isLoading, totalData, totalPages } = useFetchData(
    useGetRewardsCouponsQuery,
    {
      body: {
        limit,
        page,
        searchValue: searchQuery,
        searchIn: JSON.stringify(['rewardName', 'couponCode', 'description']),
      },
    },
  );

  // Handle Status Change
  const handleStatusChanges = (
    item: any,
    closeDialog: () => void,
    setIsLoading: any,
  ) => {
    status(item?._id).then((res: any) => {
      if (res?.error) {
        showToast('error', res?.error?.data?.message || 'Failed to update status');
      } else {
        if (res?.data?.status) {
          showToast('success', res?.data?.message || 'Status updated successfully');
          closeDialog();
        } else {
          showToast('error', res?.data?.message || 'Failed to update status');
        }
      }
      setIsLoading(false);
    });
  };

  // Handle Delete
  const handleDelete = (item: any, closeDialog: () => void) => {
    deleteRewardsCoupon(item?._id).then((res: any) => {
      if (res?.error) {
        showToast('error', res?.error?.data?.message || 'Failed to delete coupon');
      } else {
        if (res?.data?.status) {
          showToast('success', res?.data?.message || 'Coupon deleted successfully');
          closeDialog();
        } else {
          showToast('error', res?.data?.message || 'Failed to delete coupon');
        }
      }
    });
  };

  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      return formatZonedDate(date);
    } catch {
      return '-';
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  // Table Headers
  const tableHeaders: TableHeader<RewardsCoupon>[] = [
    {
      fieldName: 'rewardName',
      headerName: 'Reward Name',
      sortKey: 'rewardName',
      flex: 'flex-[1.5_0_0%]',
      render: (row: any) => {
        return <span className="font-medium">{row?.rewardName || '-'}</span>;
      },
    },
    {
      fieldName: 'couponCode',
      headerName: 'Coupon Code',
      sortKey: 'couponCode',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        return (
          <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
            {row?.couponCode || '-'}
          </span>
        );
      },
    },
    {
      fieldName: 'rewardsPoint',
      headerName: 'Points',
      sortKey: 'rewardsPoint',
      flex: 'flex-[0.7_0_0%]',
      render: (row: any) => {
        return <span>{row?.rewardsPoint || 0}</span>;
      },
    },
    {
      fieldName: 'rewardType',
      headerName: 'Type',
      sortKey: 'rewardType',
      flex: 'flex-[0.7_0_0%]',
      render: (row: any) => {
        return (
          <span className={`px-2 py-1 text-xs rounded ${
            row?.rewardType === 'PERCENTAGE' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {row?.rewardType === 'PERCENTAGE' ? '%' : 'Amount'}
          </span>
        );
      },
    },
    {
      fieldName: 'rewardValue',
      headerName: 'Value',
      sortKey: 'rewardValue',
      flex: 'flex-[0.7_0_0%]',
      render: (row: any) => {
        if (row?.rewardType === 'PERCENTAGE') {
          return <span>{row?.rewardValue || 0}%</span>;
        }
        return <span>R{row?.rewardValue || 0}</span>;
      },
    },
    {
      fieldName: 'validFrom',
      headerName: 'Valid From',
      sortKey: 'validFrom',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        return <span>{formatDate(row?.validFrom)}</span>;
      },
    },
    {
      fieldName: 'validTill',
      headerName: 'Valid Till',
      sortKey: 'validTill',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        return <span>{formatDate(row?.validTill)}</span>;
      },
    },
    {
      fieldName: 'validDays',
      headerName: 'Days',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        const days = row?.validDays || [];
        if (days.length === 0) return <span className="text-gray-400">All</span>;
        if (days.length === 7) return <span className="text-gray-600">All Days</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {days.map((day: string) => (
              <span key={day} className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                {day.slice(0, 3)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      fieldName: 'branchId',
      headerName: 'Branches',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        const branches = row?.branchId || [];
        if (branches.length === 0) return <span className="text-gray-400">All</span>;
        return <span className="text-sm">{branches.length} branch(es)</span>;
      },
    },
    {
      fieldName: 'serviceId',
      headerName: 'Services',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        const services = row?.serviceId || [];
        if (services.length === 0) return <span className="text-gray-400">All</span>;
        return <span className="text-sm">{services.length} service(s)</span>;
      },
    },
    {
      fieldName: 'createdAt',
      headerName: 'Created Date',
      sortKey: 'createdAt',
      flex: 'flex-[1_0_0%]',
      render: (row: any) => {
        return <span>{formatDate(row?.createdAt)}</span>;
      },
    },
    {
      fieldName: 'status',
      headerName: 'Status',
      extraClasses: () => 'min-w-[100px]',
      flex: 'flex-[0.8_0_0%]',
      permissions: ['REWARDSCOUPON_ACTIVE_DEACTIVE'],
      renderCell(item) {
        return (
          <div className="flex items-center gap-2">
            <ATMSwitch
              checked={item?.isActive}
              onChange={(checked) => {
                ShowConfirmation({
                  type: 'INFO',
                  confirmationText: 'Yes',
                  title: 'Are you sure?',
                  message: `Do you want to ${item?.isActive ? 'deactivate' : 'activate'} this coupon?`,
                  onConfirm: (closeDialog, setIsLoading) =>
                    handleStatusChanges(item, closeDialog, setIsLoading),
                });
              }}
              activeLabel="Yes"
              deactiveLabel="No"
            />
            {getStatusBadge(item?.isActive)}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <RewardsCouponListing
        tableHeaders={tableHeaders}
        rowData={data as RewardsCoupon[]}
        onAddNew={() => navigate('/rewards-coupon/add')}
        onEdit={(item) => navigate(`/rewards-coupon/edit/${item?._id}`)}
        filterPaginationData={{
          totalCount: totalData,
          totalPages: totalPages,
        }}
        isLoading={isLoading}
        onDelete={handleDelete}
      />
    </>
  );
};

export default RewardsCouponListingWrapper;