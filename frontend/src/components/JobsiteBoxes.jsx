import React from 'react';
import JobsiteDropdowns from './JobsiteDropdowns';
import JobsiteDropdownsExtra from './JobsiteDropdownsExtra';
import JobsiteCategories from './JobsiteCategories';
import './JobsiteBoxes.css';

export default function JobsiteBoxes() {
  return (
    <div className="jobsite-boxes-wrapper">
      <JobsiteDropdowns />
      <JobsiteDropdownsExtra />
      <JobsiteCategories />
    </div>
  );
}

