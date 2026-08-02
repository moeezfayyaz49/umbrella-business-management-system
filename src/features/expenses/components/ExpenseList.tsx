import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Box, Typography, Chip, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Expense } from '../types';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  expenses?: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseList = ({ expenses, isLoading, onEdit, onDelete }: Props) => {
  const { data: settings } = useSettings();
  const { data: categories } = useExpenseCategories();
  const navigate = useNavigate();

  const getCategoryName = (id: string) => {
    return categories?.find(c => c.id === id)?.name || 'Unknown';
  };

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : !expenses?.length ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No expenses found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id} hover>
                <TableCell>{dayjs(expense.date).format('MMM D, YYYY')}</TableCell>
                <TableCell>
                  <Chip label={getCategoryName(expense.category_id)} size="small" />
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.reference}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(expense.amount, settings?.currency)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {expense.purchase_id && (
                      <Tooltip title="View Purchase">
                        <IconButton size="small" color="info" onClick={() => navigate(`/purchases/${expense.purchase_id}`)}>
                          <ShoppingCartIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" color="primary" onClick={() => onEdit(expense)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(expense.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
