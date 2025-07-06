import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import TournamentCreate from '../../../pages/admin/tournaments/TournamentCreate';
import { AuthProvider } from '../../../context/AuthContext';

// Mock components
jest.mock('../../../components/features/tournament/TournamentInfoStep', () => {
  return function MockTournamentInfoStep({ onNext, onDataChange }) {
    return (
      <div data-testid="tournament-info-step">
        <button onClick={() => onNext()}>Next</button>
        <button onClick={() => onDataChange({ name: 'Test Tournament' })}>Set Data</button>
      </div>
    );
  };
});

jest.mock('../../../components/features/tournament/TournamentSportsStep', () => {
  return function MockTournamentSportsStep({ onNext, onPrevious, onDataChange }) {
    return (
      <div data-testid="tournament-sports-step">
        <button onClick={() => onPrevious()}>Previous</button>
        <button onClick={() => onNext()}>Next</button>
        <button onClick={() => onDataChange({ sports: ['football', 'basketball'] })}>Set Sports</button>
      </div>
    );
  };
});

jest.mock('../../../components/features/tournament/TournamentConfigStep', () => {
  return function MockTournamentConfigStep({ onNext, onPrevious, onDataChange }) {
    return (
      <div data-testid="tournament-config-step">
        <button onClick={() => onPrevious()}>Previous</button>
        <button onClick={() => onNext()}>Next</button>
        <button onClick={() => onDataChange({ format: 'knockout' })}>Set Config</button>
      </div>
    );
  };
});

jest.mock('../../../components/features/tournament/TournamentReviewStep', () => {
  return function MockTournamentReviewStep({ onPrevious, onSubmit }) {
    return (
      <div data-testid="tournament-review-step">
        <button onClick={() => onPrevious()}>Previous</button>
        <button onClick={() => onSubmit()}>Submit</button>
      </div>
    );
  };
});

const renderTournamentCreate = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <TournamentCreate />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TournamentCreate Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tournament creation wizard', () => {
    renderTournamentCreate();
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
    expect(screen.getByTestId('tournament-info-step')).toBeInTheDocument();
  });

  test('navigates through all steps', async () => {
    renderTournamentCreate();
    
    // Step 1: Info
    expect(screen.getByTestId('tournament-info-step')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Sports
    await waitFor(() => {
      expect(screen.getByTestId('tournament-sports-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 3: Config
    await waitFor(() => {
      expect(screen.getByTestId('tournament-config-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));
    
    // Step 4: Review
    await waitFor(() => {
      expect(screen.getByTestId('tournament-review-step')).toBeInTheDocument();
    });
  });

  test('handles step navigation backwards', async () => {
    renderTournamentCreate();
    
    // Navigate to step 2
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByTestId('tournament-sports-step')).toBeInTheDocument();
    });
    
    // Go back to step 1
    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => {
      expect(screen.getByTestId('tournament-info-step')).toBeInTheDocument();
    });
  });

  test('maintains data across steps', async () => {
    renderTournamentCreate();
    
    // Set data in step 1
    fireEvent.click(screen.getByText('Set Data'));
    fireEvent.click(screen.getByText('Next'));
    
    // Set data in step 2
    await waitFor(() => {
      expect(screen.getByTestId('tournament-sports-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Set Sports'));
    fireEvent.click(screen.getByText('Next'));
    
    // Set data in step 3
    await waitFor(() => {
      expect(screen.getByTestId('tournament-config-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Set Config'));
    fireEvent.click(screen.getByText('Next'));
    
    // Should reach review step
    await waitFor(() => {
      expect(screen.getByTestId('tournament-review-step')).toBeInTheDocument();
    });
  });

  test('prevents navigation without required data', () => {
    renderTournamentCreate();
    
    // Try to go to next step without setting data
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should still be on step 1
    expect(screen.getByTestId('tournament-info-step')).toBeInTheDocument();
  });

  test('handles tournament submission', async () => {
    const mockSubmit = jest.fn();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123, message: 'Tournament created successfully' })
    });

    renderTournamentCreate();
    
    // Navigate through all steps
    fireEvent.click(screen.getByText('Set Data'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByTestId('tournament-sports-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Set Sports'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByTestId('tournament-config-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Set Config'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByTestId('tournament-review-step')).toBeInTheDocument();
    });
    
    // Submit tournament
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tournaments', expect.any(Object));
    });
  });
});
