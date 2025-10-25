# 34. Testing Strategy & Implementation

## Overview

This guide establishes a comprehensive testing strategy for the Agentic Marketing Dashboard including unit tests, component tests, integration tests, E2E tests, and CI/CD integration. Target: 80%+ code coverage.

**Production Considerations:**
- Automated testing in CI/CD pipeline
- Fast test execution (<5 minutes)
- Reliable tests (no flaky tests)
- Good coverage (80%+ for critical paths)
- Test isolation (no shared state)
- Comprehensive E2E scenarios

## Prerequisites

**Completed Phases:**
- Phase 6: All previous documents (28-33)

**Dependencies:**
```bash
# Frontend testing
cd agentic-crm-template
npm install --save-dev vitest @vitejs/plugin-react
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @playwright/test
npm install --save-dev @vitest/ui @vitest/coverage-v8

# Backend testing
cd market-ai
pip install pytest pytest-asyncio pytest-cov httpx faker
```

## Frontend Testing

### Step 1: Vitest Configuration

**File: `agentic-crm-template/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/dist/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File: `agentic-crm-template/vitest.setup.ts`**

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
    isLoaded: true,
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Step 2: Unit Tests (Utilities)

**File: `agentic-crm-template/__tests__/lib/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, calculateROI } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('handles conditional classes', () => {
      expect(cn('px-4', false && 'hidden', 'py-2')).toBe('px-4 py-2');
    });

    it('handles Tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('handles date strings', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
    });
  });

  describe('calculateROI', () => {
    it('calculates ROI correctly', () => {
      expect(calculateROI(1000, 1500)).toBe(50);
    });

    it('handles negative ROI', () => {
      expect(calculateROI(1000, 800)).toBe(-20);
    });

    it('handles zero investment', () => {
      expect(calculateROI(0, 1000)).toBe(0);
    });
  });
});
```

### Step 3: Component Tests

**File: `agentic-crm-template/__tests__/components/Button.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('applies size styles', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

**File: `agentic-crm-template/__tests__/components/CampaignCard.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignCard } from '@/components/campaigns/CampaignCard';

const mockCampaign = {
  id: '1',
  name: 'Summer Sale',
  status: 'active',
  budget: 5000,
  spend: 2500,
  leads: 150,
  conversions: 30,
  createdAt: '2024-01-01',
};

describe('CampaignCard', () => {
  it('renders campaign data correctly', () => {
    render(<CampaignCard campaign={mockCampaign} />);

    expect(screen.getByText('Summer Sale')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('150 leads')).toBeInTheDocument();
  });

  it('calculates ROI correctly', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText(/20% ROI/)).toBeInTheDocument();
  });

  it('shows status badge', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('handles edit action', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<CampaignCard campaign={mockCampaign} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockCampaign);
  });

  it('shows confirmation before delete', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<CampaignCard campaign={mockCampaign} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });
});
```

### Step 4: Hook Tests

**File: `agentic-crm-template/__tests__/hooks/useCampaigns.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCampaigns } from '@/hooks/useCampaigns';

// Mock fetch
global.fetch = vi.fn();

describe('useCampaigns Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches campaigns on mount', async () => {
    const mockCampaigns = [
      { id: '1', name: 'Campaign 1' },
      { id: '2', name: 'Campaign 2' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCampaigns,
    });

    const { result } = renderHook(() => useCampaigns());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.campaigns).toEqual(mockCampaigns);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCampaigns());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.campaigns).toEqual([]);
  });

  it('filters campaigns by status', async () => {
    const mockCampaigns = [
      { id: '1', name: 'Campaign 1', status: 'active' },
      { id: '2', name: 'Campaign 2', status: 'paused' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCampaigns,
    });

    const { result } = renderHook(() => useCampaigns({ status: 'active' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.campaigns).toHaveLength(1);
    expect(result.current.campaigns[0].status).toBe('active');
  });
});
```

### Step 5: E2E Tests (Playwright)

**File: `agentic-crm-template/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**File: `agentic-crm-template/e2e/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to sign in', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should allow user to sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sign out');

    await expect(page).toHaveURL('/');
  });
});
```

**File: `agentic-crm-template/e2e/campaigns.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new campaign', async ({ page }) => {
    await page.goto('/campaigns');
    await page.click('button:text("Create Campaign")');

    await page.fill('input[name="name"]', 'Test Campaign');
    await page.fill('input[name="budget"]', '5000');
    await page.selectOption('select[name="type"]', 'email');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Campaign created successfully')).toBeVisible();
    await expect(page.locator('text=Test Campaign')).toBeVisible();
  });

  test('should edit a campaign', async ({ page }) => {
    await page.goto('/campaigns');

    // Click first campaign
    await page.click('[data-testid="campaign-card"]:first-child');
    await page.click('button:text("Edit")');

    await page.fill('input[name="name"]', 'Updated Campaign');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Campaign updated')).toBeVisible();
  });

  test('should delete a campaign', async ({ page }) => {
    await page.goto('/campaigns');

    await page.click('[data-testid="campaign-card"]:first-child [data-testid="delete-button"]');
    await page.click('button:text("Confirm")');

    await expect(page.locator('text=Campaign deleted')).toBeVisible();
  });

  test('should filter campaigns by status', async ({ page }) => {
    await page.goto('/campaigns');

    await page.selectOption('select[name="status"]', 'active');

    const campaigns = await page.locator('[data-testid="campaign-card"]').all();
    for (const campaign of campaigns) {
      await expect(campaign.locator('[data-testid="status-badge"]')).toHaveText('Active');
    }
  });
});
```

## Backend Testing

### Step 1: Pytest Configuration

**File: `market-ai/pytest.ini`**

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --cov=.
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
asyncio_mode = auto
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

**File: `market-ai/conftest.py`**

```python
import pytest
import asyncio
from httpx import AsyncClient
from main import app

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    """HTTP client for API testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_db():
    """Mock database connection"""
    # Setup mock
    yield
    # Teardown

@pytest.fixture
def sample_campaign():
    """Sample campaign data for testing"""
    return {
        "id": "test-campaign-1",
        "name": "Test Campaign",
        "budget": 5000.0,
        "status": "active",
    }

@pytest.fixture
def auth_headers():
    """Authentication headers for testing"""
    return {"Authorization": "Bearer test-token"}
```

### Step 2: API Endpoint Tests

**File: `market-ai/tests/test_campaigns.py`**

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_campaigns(client: AsyncClient, auth_headers):
    """Test getting campaigns list"""
    response = await client.get("/api/campaigns", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_create_campaign(client: AsyncClient, auth_headers):
    """Test creating a campaign"""
    campaign_data = {
        "name": "Test Campaign",
        "budget": 5000.0,
        "type": "email",
    }

    response = await client.post(
        "/api/campaigns",
        json=campaign_data,
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Campaign"
    assert data["budget"] == 5000.0

@pytest.mark.asyncio
async def test_create_campaign_validation(client: AsyncClient, auth_headers):
    """Test campaign creation with invalid data"""
    invalid_data = {
        "name": "",  # Empty name
        "budget": -100,  # Negative budget
    }

    response = await client.post(
        "/api/campaigns",
        json=invalid_data,
        headers=auth_headers
    )

    assert response.status_code == 422
    assert "validation error" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_campaign_by_id(client: AsyncClient, auth_headers, sample_campaign):
    """Test getting a specific campaign"""
    campaign_id = sample_campaign["id"]
    response = await client.get(
        f"/api/campaigns/{campaign_id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == campaign_id

@pytest.mark.asyncio
async def test_update_campaign(client: AsyncClient, auth_headers, sample_campaign):
    """Test updating a campaign"""
    campaign_id = sample_campaign["id"]
    update_data = {"name": "Updated Campaign"}

    response = await client.patch(
        f"/api/campaigns/{campaign_id}",
        json=update_data,
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Campaign"

@pytest.mark.asyncio
async def test_delete_campaign(client: AsyncClient, auth_headers, sample_campaign):
    """Test deleting a campaign"""
    campaign_id = sample_campaign["id"]
    response = await client.delete(
        f"/api/campaigns/{campaign_id}",
        headers=auth_headers
    )

    assert response.status_code == 204

@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test API without authentication"""
    response = await client.get("/api/campaigns")
    assert response.status_code == 401
```

### Step 3: Service Layer Tests

**File: `market-ai/tests/test_ai_service.py`**

```python
import pytest
from services.ai_service import AIService
from unittest.mock import Mock, patch

@pytest.mark.unit
def test_generate_content():
    """Test AI content generation"""
    service = AIService()

    with patch("openai.ChatCompletion.create") as mock_openai:
        mock_openai.return_value = Mock(
            choices=[Mock(message=Mock(content="Generated content"))]
        )

        result = service.generate_content("Test prompt")

        assert result == "Generated content"
        mock_openai.assert_called_once()

@pytest.mark.unit
def test_analyze_sentiment():
    """Test sentiment analysis"""
    service = AIService()

    positive_text = "This is amazing! I love it!"
    negative_text = "This is terrible. I hate it."

    assert service.analyze_sentiment(positive_text) > 0.5
    assert service.analyze_sentiment(negative_text) < 0.5

@pytest.mark.unit
def test_budget_tracking():
    """Test budget tracking in AI service"""
    service = AIService(max_budget=10.0)

    # Simulate expensive call
    service.track_cost(5.0)
    assert service.get_remaining_budget() == 5.0

    # Should raise exception when budget exceeded
    with pytest.raises(Exception, match="Budget exceeded"):
        service.track_cost(6.0)
```

## CI/CD Integration

### GitHub Actions Workflow

**File: `agentic-crm-template/.github/workflows/test.yml`**

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: agentic-crm-template

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: agentic-crm-template/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test -- --coverage

      - name: E2E tests
        run: npx playwright install --with-deps && npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./agentic-crm-template/coverage/lcov.info
          flags: frontend

  backend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: market-ai

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt -r requirements-dev.txt

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: pytest --cov --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./market-ai/coverage.xml
          flags: backend
```

## Test Coverage Reports

### Viewing Coverage

```bash
# Frontend
npm run test -- --coverage
open coverage/index.html

# Backend
pytest --cov --cov-report=html
open htmlcov/index.html
```

### Coverage Badges

Add to README.md:

```markdown
[![Frontend Coverage](https://codecov.io/gh/your-org/your-repo/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/your-org/your-repo)
[![Backend Coverage](https://codecov.io/gh/your-org/your-repo/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/your-org/your-repo)
```

## Best Practices

1. **Write tests first** - TDD for critical features
2. **Test behavior, not implementation** - Focus on outcomes
3. **Keep tests isolated** - No shared state
4. **Use descriptive names** - `test_user_can_create_campaign_with_valid_data`
5. **Follow AAA pattern** - Arrange, Act, Assert
6. **Mock external services** - Don't call real APIs in tests
7. **Test edge cases** - Empty strings, null values, large numbers
8. **Maintain fast tests** - < 5 minutes total
9. **Fix flaky tests** - 100% reliability
10. **Review coverage** - Focus on critical paths

## Troubleshooting

### Common Issues

1. **Tests timeout**
   - Increase timeout in config
   - Mock slow operations
   - Use `waitFor` correctly

2. **Flaky tests**
   - Remove `setTimeout` dependencies
   - Mock date/time
   - Ensure cleanup between tests

3. **Low coverage**
   - Identify untested code
   - Add tests for critical paths
   - Exclude test files from coverage

## Next Steps

1. **Security Testing (Document 35)** - Penetration testing
2. **Set up Test Database** - Separate from production
3. **Implement Visual Regression Testing** - Percy or Chromatic
4. **Add Load Testing** - k6 or Artillery
5. **Create Test Data Factories** - Faker for realistic data

---

**Testing Checklist:**
- [ ] Vitest configured
- [ ] Testing utilities installed
- [ ] Unit tests written (80%+ coverage)
- [ ] Component tests implemented
- [ ] Hook tests created
- [ ] E2E tests configured (Playwright)
- [ ] Backend tests written (pytest)
- [ ] CI/CD integration working
- [ ] Coverage reports generated
- [ ] All tests passing
- [ ] No flaky tests
- [ ] Test documentation created
