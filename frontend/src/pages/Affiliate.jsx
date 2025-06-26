import React, { useState, useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Users, DollarSign, TrendingUp, Link, Share2, X } from 'lucide-react'

const Affiliate = () => {
  const { token, backendUrl } = useContext(ShopContext)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    website: '',
    socialMedia: '',
    experience: '',
    reason: '',
    trafficSource: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Please login to apply for the affiliate program')
      navigate('/login')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`${backendUrl}/api/affiliate/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Affiliate application submitted successfully! We will review your application and get back to you within 2-3 business days.')
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          website: '',
          socialMedia: '',
          experience: '',
          reason: '',
          trafficSource: ''
        })
        setShowForm(false)
      } else {
        toast.error(data.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting affiliate application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Competitive Commission",
      description: "Earn up to 10% commission on every sale you refer"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Real-time Tracking",
      description: "Track your referrals and earnings in real-time"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Performance Bonuses",
      description: "Extra bonuses for top-performing affiliates"
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Custom Links",
      description: "Get personalized affiliate links and promotional materials"
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Marketing Support",
      description: "Access to banners, product images, and marketing materials"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Monthly Payouts",
      description: "Reliable monthly payments with multiple payout options"
    }
  ]

  const steps = [
    {
      step: "1",
      title: "Apply",
      description: "Fill out our simple application form"
    },
    {
      step: "2", 
      title: "Review",
      description: "We review your application within 2-3 business days"
    },
    {
      step: "3",
      title: "Approval",
      description: "Get approved and receive your unique affiliate links"
    },
    {
      step: "4",
      title: "Promote",
      description: "Start promoting and earning commissions"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-black to-gray-800 text-white">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Join Our <span className="text-yellow-400">Affiliate Program</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              Partner with us and earn competitive commissions by promoting our premium products to your audience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-yellow-400 text-black hover:bg-yellow-500 text-lg px-8 py-3"
              >
                Apply Now
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-yellow-500 hover:bg-white hover:text-black text-lg px-8 py-3"
                onClick={() => navigate('/affiliate/dashboard')}
              >
                Affiliate Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Partner With Us?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of successful affiliates who are earning substantial commissions by promoting our products
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                  {benefit.icon}
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Getting started is simple and straightforward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Structure */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Commission Structure
          </h2>
          <p className="text-xl text-gray-600">
            Competitive rates that reward your success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center border-2 border-gray-200">
            <CardHeader>
              <Badge variant="secondary" className="mx-auto mb-2">Starter</Badge>
              <CardTitle className="text-2xl">5%</CardTitle>
              <CardDescription>0-10 sales per month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Perfect for getting started</p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-yellow-400 relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black">
              Most Popular
            </Badge>
            <CardHeader>
              <Badge variant="secondary" className="mx-auto mb-2">Professional</Badge>
              <CardTitle className="text-2xl">7.5%</CardTitle>
              <CardDescription>11-25 sales per month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">For serious affiliates</p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-gray-200">
            <CardHeader>
              <Badge variant="secondary" className="mx-auto mb-2">Elite</Badge>
              <CardTitle className="text-2xl">10%</CardTitle>
              <CardDescription>25+ sales per month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Maximum earning potential</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join our affiliate program today and start earning commissions on every sale you refer
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-yellow-400 text-black hover:bg-yellow-500 text-lg px-8 py-3"
          >
            Apply Now - It's Free!
          </Button>
        </div>
      </div>

      {/* Application Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Apply for Affiliate Program</DialogTitle>
            <DialogDescription>
              Fill out the form below to apply for our affiliate program. We'll review your application and get back to you within 2-3 business days.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="website">Website/Blog URL</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="socialMedia">Social Media Profiles</Label>
              <Textarea
                id="socialMedia"
                name="socialMedia"
                value={formData.socialMedia}
                onChange={handleInputChange}
                placeholder="List your social media profiles (Instagram, YouTube, TikTok, etc.)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="trafficSource">Primary Traffic Source *</Label>
              <Select name="trafficSource" onValueChange={(value) => setFormData(prev => ({...prev, trafficSource: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary traffic source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website/Blog</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experience">Marketing Experience</Label>
              <Textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Tell us about your marketing experience and audience size"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="reason">Why do you want to join our affiliate program? *</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                placeholder="Tell us why you're interested in promoting our products"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Affiliate
