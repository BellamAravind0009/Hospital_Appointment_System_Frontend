import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { fetchAppointments, updateAppointment } from "../api";
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner, 
  Row, 
  Col,
  InputGroup
} from "react-bootstrap";
import { Calendar, Clock, Edit, User, CheckCircle, ArrowLeft } from "react-feather";

const UpdateAppointment = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [allAppointments, setAllAppointments] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [step, setStep] = useState(1);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };
  
  // Fetch all appointments when component mounts
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await fetchAppointments();
        setAllAppointments(response.data);
      } catch (error) {
        console.error("Error loading appointments:", error);
        setMessage({
          type: "danger",
          text: "Failed to load appointments. Please try again."
        });
      }
    };
    
    loadAppointments();
  }, []);

  const fetchAppointment = async () => {
    if (!name.trim()) {
      setMessage({ type: "warning", text: "Please enter your name" });
      return;
    }
    
    setFetchLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const foundAppointment = allAppointments.find(
        (appt) => appt.name.toLowerCase() === name.toLowerCase()
      );
      
      if (!foundAppointment) {
        setMessage({ 
          type: "warning", 
          text: "No appointment found for this name. Please check the spelling or create a new appointment." 
        });
        setAppointment(null);
        return;
      }
  
      setAppointment(foundAppointment);
      setNewDate(foundAppointment.date);
      setStep(2);
    } catch (error) {
      console.error("Error fetching:", error);
      setMessage({ 
        type: "danger", 
        text: "Error fetching appointment details. Please try again." 
      });
    } finally {
      setFetchLoading(false);
    }
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!appointment || !newDate) {
      setMessage({ type: "warning", text: "Please enter a valid date." });
      return;
    }
    
    if (newDate === appointment.date) {
      setMessage({ type: "info", text: "The new date is the same as the current date. No changes needed." });
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
  
    try {
      await updateAppointment({ name: appointment.name, date: newDate });
      setMessage({ 
        type: "success", 
        text: "Appointment updated successfully!" 
      });
      setStep(3);
    } catch (error) {
      console.error("Update error:", error);
      setMessage({ 
        type: "danger", 
        text: error.response?.data?.error || "Error updating appointment. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setAppointment(null);
    } else if (step === 3) {
      navigate("/appointments");
    }
  };
  
  const goToAppointments = () => {
    navigate("/appointments");
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  {step === 1 && <><Edit size={20} className="me-2" /> Find Your Appointment</>}
                  {step === 2 && <><Calendar size={20} className="me-2" /> Update Appointment</>}
                  {step === 3 && <><CheckCircle size={20} className="me-2" /> Appointment Updated</>}
                </h4>
                {step > 1 && (
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={goBack}
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                )}
              </div>
            </Card.Header>
            
            <Card.Body className="p-4">
              {message.text && (
                <Alert variant={message.type} className="mb-4">
                  {message.text}
                </Alert>
              )}
              
              {step === 1 && (
                <>
                  <p className="text-muted mb-4">
                    Enter your name to find your appointment. We'll help you reschedule it.
                  </p>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Your Name</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <User size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      onClick={fetchAppointment}
                      disabled={fetchLoading}
                    >
                      {fetchLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Searching...
                        </>
                      ) : (
                        "Find Appointment"
                      )}
                    </Button>
                  </div>
                </>
              )}
              
              {step === 2 && appointment && (
                <Form onSubmit={handleUpdate}>
                  <div className="mb-4">
                    <h5>Appointment Details</h5>
                    <Card className="bg-light mb-4">
                      <Card.Body>
                        <Row>
                          <Col sm={6}>
                            <p className="mb-1"><strong>Patient:</strong> {appointment.name}</p>
                            <p className="mb-1"><strong>Department:</strong> {appointment.department}</p>
                          </Col>
                          <Col sm={6}>
                            <p className="mb-1"><strong>Doctor:</strong> {appointment.doctor}</p>
                            <p className="mb-1"><strong>Token:</strong> {appointment.token_number}</p>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Current Appointment Date</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Calendar size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={formatDate(appointment.date)}
                        disabled
                        className="bg-light"
                      />
                    </InputGroup>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>New Appointment Date</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Clock size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        type="date"
                        value={newDate}
                        min={getTodayDate()}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                      />
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Select a new date for your appointment
                    </Form.Text>
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      variant="warning" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Updating...
                        </>
                      ) : (
                        "Update Appointment"
                      )}
                    </Button>
                  </div>
                </Form>
              )}
              
              {step === 3 && (
                <div className="text-center py-3">
                  <div className="mb-4">
                    <CheckCircle size={80} className="text-success mb-3" />
                    <h4>Appointment Updated Successfully!</h4>
                    <p className="text-muted">
                      Your appointment has been rescheduled for {formatDate(newDate)}.
                    </p>
                  </div>
                  
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={goToAppointments}
                    >
                      View All Appointments
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
            
            <Card.Footer className="bg-light text-center py-3">
              <small className="text-muted">
                Need help? Contact our support team at support@holistichospitals.com
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UpdateAppointment;