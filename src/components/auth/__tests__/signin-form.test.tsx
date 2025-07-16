/**
 * Sign In Form Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { SignInForm } from '../signin-form'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock next-auth SignInResponse type
type MockSignInResponse = {
  error: string | undefined
  status: number
  ok: boolean
  url: string | null
  code: string
}

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('SignInForm', () => {
  beforeEach(() => {
    mockSignIn.mockClear()
  })

  it('renders sign in form correctly', () => {
    render(<SignInForm />)
    
    expect(screen.getByRole('heading', { name: /sign in with eve online/i })).toBeDefined()
    expect(screen.getByText('Connect your EVE Online character to access personalized optimization')).toBeDefined()
    expect(screen.getByRole('button', { name: /sign in with eve online/i })).toBeDefined()
  })

  it('displays error message when error prop is provided', () => {
    render(<SignInForm error="AccessDenied" />)
    
    expect(screen.getByText('Access denied. Please make sure you have the required permissions.')).toBeDefined()
  })

  it('calls signIn when button is clicked', async () => {
    mockSignIn.mockResolvedValue({ error: undefined, status: 200, ok: true, url: null, code: '200' } as MockSignInResponse)
    
    render(<SignInForm />)
    
    const signInButton = screen.getByRole('button', { name: /sign in with eve online/i })
    fireEvent.click(signInButton)
    
    expect(mockSignIn).toHaveBeenCalledWith('eveonline', {
      callbackUrl: '/dashboard',
      redirect: true,
    })
  })

  it('uses custom callback URL when provided', async () => {
    mockSignIn.mockResolvedValue({ error: undefined, status: 200, ok: true, url: null, code: '200' } as MockSignInResponse)
    
    render(<SignInForm callbackUrl="/custom-url" />)
    
    const signInButton = screen.getByRole('button', { name: /sign in with eve online/i })
    fireEvent.click(signInButton)
    
    expect(mockSignIn).toHaveBeenCalledWith('eveonline', {
      callbackUrl: '/custom-url',
      redirect: true,
    })
  })

  it('displays required permissions section', () => {
    render(<SignInForm />)
    
    expect(screen.getByText('Required Permissions')).toBeDefined()
    expect(screen.getByText('• Character information and skills')).toBeDefined()
    expect(screen.getByText('• Asset and wallet data')).toBeDefined()
  })

  it('handles unknown error types', () => {
    render(<SignInForm error="UnknownError" />)
    
    expect(screen.getByText('An error occurred during sign in. Please try again.')).toBeDefined()
  })
})