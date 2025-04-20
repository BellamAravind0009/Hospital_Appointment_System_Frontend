import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { fetchProfiles, createProfile, updateProfile, deleteProfile } from "../api";
import { Plus, Edit2, Trash2, User, Save } from "react-feather";

const ProfileManagement = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    profile_name: "",
    patient_name: "",
    age: "",
    sex: "O"
  });
  
  const [editProfileName, setEditProfileName] = useState("");
  const [profileToDelete, setProfileToDelete] = useState(null);

  // Load profiles on component mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchProfiles();
      setProfiles(response.data);
    } catch (error) {
      console.error("Error loading profiles:", error);
      const errorMsg = error.response?.data?.message || "Failed to load profiles";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      profile_name: "",
      patient_name: "",
      age: "",
      sex: "O"
    });
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (profile) => {
    setFormData({
      profile_name: profile.profile_name,
      patient_name: profile.patient_name,
      age: profile.age,
      sex: profile.sex || "O"
    });
    setEditProfileName(profile.profile_name);
    setShowEditModal(true);
  };

  const handleDeleteClick = (profile) => {
    setProfileToDelete(profile);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      await createProfile(formData);
      setSuccess("Profile created successfully!");
      await loadProfiles();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating profile:", error);
      const errorMsg = error.response?.data?.message || "Failed to create profile";
      setError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(editProfileName, formData);
      setSuccess("Profile updated successfully!");
      await loadProfiles();
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMsg = error.response?.data?.message || "Failed to update profile";
      setError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;
    
    try {
      setFormLoading(true);
      await deleteProfile(profileToDelete.profile_name);
      setSuccess("Profile deleted successfully!");
      await loadProfiles();
    } catch (error) {
      console.error("Error deleting profile:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete profile";
      setError(errorMsg);
    } finally {
      setFormLoading(false);
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <User className="me-2" size={20} />
            <h4 className="mb-0">Patient Profiles</h4>
          </div>
          <Button
            variant="outline-light"
            size="sm"
            onClick={handleAddClick}
          >
            <Plus size={16} className="me-1" /> Add New Profile
          </Button>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <User size={60} className="text-muted" />
              </div>
              <h5>No profiles found</h5>
              <p className="text-muted">Create a profile to easily book appointments</p>
              <Button
                variant="primary"
                onClick={handleAddClick}
              >
                <Plus size={16} className="me-1" /> Create Your First Profile
              </Button>
            </div>
          ) : (
            <Row className="g-4">
              {profiles.map((profile, index) => (
                <Col key={index} lg={6} xl={4}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">{profile.profile_name}</h5>
                        <div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditClick(profile)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(profile)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <Card.Text>
                        <strong>Name:</strong> {profile.patient_name}
                      </Card.Text>
                      <Card.Text>
                        <strong>Age:</strong> {profile.age}
                      </Card.Text>
                      <Card.Text>
                        <strong>Sex:</strong> {profile.sex === "M" ? "Male" : profile.sex === "F" ? "Female" : "Other"}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {/* Add Profile Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Profile Name</Form.Label>
              <Form.Control
                type="text"
                name="profile_name"
                value={formData.profile_name}
                onChange={handleChange}
                placeholder="Enter a name for this profile (e.g. Self, Son, Daughter)"
                required
              />
              <Form.Text className="text-muted">
                A unique name to identify this profile
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Patient Name</Form.Label>
              <Form.Control
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="Enter patient's full name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Age</Form.Label>
              <Form.Control
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter patient's age"
                required
                min={0}
                max={120}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Sex</Form.Label>
              <Form.Select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} className="me-1" /> Save Profile
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Edit Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Profile Name</Form.Label>
              <Form.Control
                type="text"
                name="profile_name"
                value={formData.profile_name}
                onChange={handleChange}
                placeholder="Enter a name for this profile"
                required
                disabled
              />
              <Form.Text className="text-muted">
                Profile name cannot be changed
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Patient Name</Form.Label>
              <Form.Control
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="Enter patient's full name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Age</Form.Label>
              <Form.Control
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter patient's age"
                required
                min={0}
                max={120}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Sex</Form.Label>
              <Form.Select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} className="me-1" /> Update Profile
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the profile "{profileToDelete?.profile_name}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={formLoading}>
            {formLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                Deleting...
              </>
            ) : (
              "Delete Profile"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProfileManagement;