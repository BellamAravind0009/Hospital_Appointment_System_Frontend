import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOrder, verifyPayment } from "../api"; 
import { Spinner, Container, Card, Alert, Button } from "react-bootstrap";
import { CreditCard, Info, ArrowLeft } from "react-feather";

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_RjiPloZTcFARKZ";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Get appointment details from navigation state
  const { formData, amount } = location.state || {};

  useEffect(() => {
    // Validate input data
    if (!formData || !amount) {
      setError("Invalid appointment details");
      setTimeout(() => navigate("/book"), 3000);
      return;
    }

    // Load Razorpay script on component mount
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setError("Failed to load payment gateway");
      setScriptLoaded(false);
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [formData, amount, navigate]);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError("Payment gateway not available. Please refresh the page.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      // Create order
      const orderResponse = await createOrder({
        amount, 
        appointment_id: formData.id
      });

      const { order_id, amount: orderAmount, currency } = orderResponse.data;

      // Initialize Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        amount: orderAmount,
        currency,
        name: "Hospital System",
        description: "Appointment Payment",
        order_id,
        handler: async function (response) {
          try {
            // Set loading state for verification
            setIsLoading(true);
            
            const verifyResponse = await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyResponse.status === 200) {
              const appointmentData = verifyResponse.data.appointment;
              navigate("/confirmation", { state: appointmentData });
            } else {
              setError("Payment verification failed");
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Verification error:", error);
            setError(error.response?.data?.error || "Error verifying payment");
            setIsLoading(false);
          }
        },
        prefill: { 
          name: formData.name, 
          email: localStorage.getItem("email") || "", 
          contact: localStorage.getItem("phone") || "" 
        },
        theme: { color: "#3399cc" },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      // Open Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Payment Error:", error);
      setError(error.response?.data?.error || "Error processing payment");
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card className="shadow-lg border-0 p-4 text-center" style={{ maxWidth: "500px" }}>
          <div className="text-danger mb-3">
            <Info size={48} />
          </div>
          <h3 className="text-danger mb-3">Error</h3>
          <Alert variant="danger">{error}</Alert>
          <Button 
            onClick={() => navigate("/book")} 
            variant="primary"
            className="mt-3"
          >
            <ArrowLeft size={16} className="me-2" />
            Return to Booking
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="shadow-lg border-0 p-4" style={{ maxWidth: "500px" }}>
        <div className="text-center mb-4">
          <CreditCard size={48} className="text-primary mb-3" />
          <h2 className="mb-1">Complete Your Payment</h2>
          <p className="text-muted">Secure payment with Razorpay</p>
        </div>
        
        <Card className="mb-4 bg-light border-0">
          <Card.Body>
            <h5 className="card-title">Appointment Details</h5>
            <table className="table table-borderless mb-0">
              <tbody>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>{formData?.name}</td>
                </tr>
                <tr>
                  <td><strong>Department:</strong></td>
                  <td>{formData?.department}</td>
                </tr>
                <tr>
                  <td><strong>Doctor:</strong></td>
                  <td>{formData?.doctor}</td>
                </tr>
                <tr>
                  <td><strong>Date:</strong></td>
                  <td>{formData?.date}</td>
                </tr>
                <tr>
                  <td><strong>Time:</strong></td>
                  <td>{formData?.time}</td>
                </tr>
              </tbody>
            </table>
          </Card.Body>
        </Card>
        
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
          <span>Amount to pay:</span>
          <strong style={{ fontSize: "1.25rem" }}>₹{amount}</strong>
        </div>
        
        <Button 
          onClick={handlePayment} 
          variant="success"
          size="lg"
          className="py-3"
          disabled={isLoading || !scriptLoaded}
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : !scriptLoaded ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Loading Payment Gateway...
            </>
          ) : (
            <>Pay Now</>
          )}
        </Button>
        
        <div className="text-center mt-3">
          <Button 
            variant="link" 
            className="text-muted" 
            onClick={() => navigate("/book")}
          >
            Cancel and return to booking
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default Payment;