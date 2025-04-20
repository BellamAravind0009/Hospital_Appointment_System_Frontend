import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { fetchAppointments, cancelAppointment } from "../api";
import { Card, Container, Table, Badge, Spinner, Alert, Form, InputGroup, Button, Row, Col, Modal } from "react-bootstrap";
import { Calendar, Search, Filter, RefreshCw } from "react-feather";

const ViewAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState("");
  const [cancelError, setCancelError] = useState("");

  const fetchAppointmentData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized: Please log in.");
        setLoading(false);
        return;
      }
      
      const response = await fetchAppointments();
      setAppointments(response.data);
      setFilteredAppointments(response.data);
    } catch (err) {
      console.error("Error Details:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError("Error fetching appointments. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointmentData();
  }, []);

  useEffect(() => {
    // Apply filters whenever search term or filters change
    let results = appointments;
    
    // Filter by search term
    if (searchTerm) {
      results = results.filter(
        (appt) => 
          appt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appt.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appt.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      const today = new Date();
      if (filterStatus === "upcoming") {
        results = results.filter(appt => new Date(appt.date) >= today);
      } else if (filterStatus === "completed") {
        results = results.filter(appt => new Date(appt.date) < today);
      }
    }
    
    // Filter by department
    if (filterDepartment !== "all") {
      results = results.filter(appt => appt.department === filterDepartment);
    }
    
    setFilteredAppointments(results);
  }, [searchTerm, filterStatus, filterDepartment, appointments]);

  // Get unique departments for filter dropdown
  const departments = [...new Set(appointments.map(appt => appt.department))];

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleRefresh = () => {
    fetchAppointmentData();
  };

  const getStatusBadge = (date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    
    if (appointmentDate < today) {
      return <Badge bg="secondary">Completed</Badge>;
    } else if (appointmentDate.toDateString() === today.toDateString()) {
      return <Badge bg="warning" text="dark">Today</Badge>;
    } else {
      return <Badge bg="success">Upcoming</Badge>;
    }
  };
  
  // Open cancel confirmation modal
  const handleOpenCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelError("");
    setCancelSuccess("");
    setShowCancelModal(true);
  };
  
  // Close cancel modal
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
    // Reset any success or error messages after a delay
    setTimeout(() => {
      setCancelSuccess("");
      setCancelError("");
    }, 300);
  };
  
  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    setCancelLoading(true);
    setCancelError("");
    setCancelSuccess("");
    
    try {
      await cancelAppointment(appointmentToCancel.id);
      
      // Update the local state to remove the cancelled appointment
      const updatedAppointments = appointments.filter(
        appt => appt.id !== appointmentToCancel.id
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(filteredAppointments.filter(
        appt => appt.id !== appointmentToCancel.id
      ));
      
      setCancelSuccess("Appointment cancelled successfully");
      
      // Close modal after showing success message for a moment
      setTimeout(() => {
        handleCloseCancelModal();
      }, 1500);
      
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setCancelError(
        err.response?.data?.error || 
        "Failed to cancel appointment. Please try again."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Calendar className="me-2" size={20} />
            <h4 className="mb-0">Your Appointments</h4>
          </div>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
          >
            {refreshing ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="me-1" /> Refresh
              </>
            )}
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading appointments...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              {/* Search and Filters */}
              <Row className="mb-4 g-3">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text id="search-addon">
                      <Search size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search by name, doctor, or department"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <InputGroup>
                    <InputGroup.Text id="status-addon">
                      <Filter size={16} />
                    </InputGroup.Text>
                    <Form.Select 
                      aria-label="Filter by status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                    </Form.Select>
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    aria-label="Filter by department"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-4">
                  <img 
                    src="/assets/empty-calendar.svg" 
                    alt="No appointments" 
                    style={{ maxWidth: '150px', opacity: 0.6 }}
                    className="mb-3"
                  />
                  <h5>No appointments found</h5>
                  <p className="text-muted">
                    {searchTerm || filterStatus !== "all" || filterDepartment !== "all" 
                      ? "Try adjusting your filters or search term"
                      : "You don't have any appointments yet"}
                  </p>
                  <Button variant="primary" href="/book">
                    Book an Appointment
                  </Button>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Department</th>
                          <th>Doctor</th>
                          <th>Date</th>
                          <th>Token Number</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((appt, index) => (
                          <tr key={index}>
                            <td>{appt.name}</td>
                            <td>{appt.department}</td>
                            <td>{appt.doctor}</td>
                            <td>{formatDate(appt.date)}</td>
                            <td>
                              <Badge bg="info" pill>
                                {appt.token_number}
                              </Badge>
                            </td>
                            <td>{getStatusBadge(appt.date)}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-1"
                                disabled={new Date(appt.date) < new Date()}
                              >
                                Details
                              </Button>
                              {new Date(appt.date) >= new Date() && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleOpenCancelModal(appt)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                      Showing {filteredAppointments.length} of {appointments.length} appointments
                    </small>
                    <Button variant="primary" href="/book">
                      Book New Appointment
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </Card.Body>
        <Card.Footer className="bg-light">
          <small className="text-muted">
            Last updated: {new Date().toLocaleString()}
          </small>
        </Card.Footer>
      </Card>
      
      {/* Cancel Appointment Confirmation Modal */}
      <Modal show={showCancelModal} onHide={handleCloseCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelSuccess ? (
            <Alert variant="success">{cancelSuccess}</Alert>
          ) : (
            <>
              {cancelError && <Alert variant="danger">{cancelError}</Alert>}
              <p>Are you sure you want to cancel this appointment?</p>
              {appointmentToCancel && (
                <div className="bg-light p-3 rounded mb-3">
                  <p className="mb-1"><strong>Name:</strong> {appointmentToCancel.name}</p>
                  <p className="mb-1"><strong>Department:</strong> {appointmentToCancel.department}</p>
                  <p className="mb-1"><strong>Doctor:</strong> {appointmentToCancel.doctor}</p>
                  <p className="mb-1"><strong>Date:</strong> {formatDate(appointmentToCancel.date)}</p>
                  <p className="mb-0"><strong>Token Number:</strong> {appointmentToCancel.token_number}</p>
                </div>
              )}
              <p className="text-danger mb-0">This action cannot be undone.</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!cancelSuccess && (
            <>
              <Button variant="secondary" onClick={handleCloseCancelModal}>
                No, Keep Appointment
              </Button>
              <Button 
                variant="danger" 
                onClick={handleCancelAppointment}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Appointment"
                )}
              </Button>
            </>
          )}
          {cancelSuccess && (
            <Button variant="primary" onClick={handleCloseCancelModal}>
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ViewAppointments;