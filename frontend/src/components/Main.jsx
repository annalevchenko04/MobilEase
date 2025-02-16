import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { motion } from "framer-motion";
import { FaLeaf, FaBalanceScale, FaChartLine } from "react-icons/fa";
import ImageCarousel from "./ImageCarousel";

export default function SustainabilityPage() {
  return (
      <div className="min-h-screen bg-gray-900 text-white">


          {/* Info Section */}
          <div className="py-12 px-6 md:px-20 text-center">
              <div className="items-center">
                  <motion.div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* Left Column: Text Block */}

                      <motion.div
                          className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"
                          whileHover={{scale: 1.05}}
                      >
                          <div className="has-text-centered">
                              <br/>
                              <br/>
                              <br/>
                              <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">
                                  Calculate your Footprint with Carbon Calculator
                              </h3>
                              <img
                                  src="/images/arrow.png"
                                  alt="Description of image"
                                  className="is-fullwidth"
                                  style={{maxWidth: "80%", height: "150px", margin: "20px 0", objectFit: "contain"}}
                              />
                          </div>
                      </motion.div>

                      {/* Right Column: Image */}
                      <div className="image-column">
                      <motion.img
                              src="/images/p6.png"
                              alt="Description of image"
                              className="image-motion"
                              style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}
                              initial={{opacity: 0, y: 50}}
                              animate={{opacity: 1, y: 0}}
                              transition={{duration: 1}}
                              whileHover={{scale: 1.2}}
                          />
                      </div>
                  </motion.div>
              </div>

              <div className="items-center">
                  <motion.div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* Left Column: Text Block */}
                      <div className="image-column">
                          <motion.img
                              src="/images/p3.png"
                              alt="Description of image"
                              className="image-motion"
                              style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}
                              initial={{opacity: 0, y: 50}}
                              animate={{opacity: 1, y: 0}}
                              transition={{duration: 1}}
                              whileHover={{scale: 1.2}}
                          />
                      </div>

                      {/* Right Column: Image */}
                      <motion.div className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"
                                  whileHover={{scale: 1.05}}>
                          <div style={{textAlign: "center"}}>
                              <br/>
                              <br/>
                              <br/>
                              <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">
                                  Share your Experience how to achieve goals </h3>
                              <img
                                  src="/images/arrow2.png"
                                  alt="Description of image"
                                  className="is-fullwidth"
                                  style={{maxWidth: "80%", height: "200px", margin: "20px 0", objectFit: "contain"}}
                              />
                          </div>
                      </motion.div>
                  </motion.div>
              </div>
              <div className="items-center">
                  <motion.div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* Left Column: Text Block */}
                      <motion.div className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"
                                  whileHover={{scale: 1.05}}>
                          <div style={{textAlign: "center"}}>
                              <br/>
                              <br/>
                              <br/>
                              <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">
                                  Explore Analytics and Posts to gain knowledge</h3>
                          </div>
                      </motion.div>

                      {/* Right Column: Image */}
                      <div className="image-column">
                          <motion.img
                              src="/images/p2.png"
                              alt="Description of image"
                              className="image-motion"
                              style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}
                              initial={{opacity: 0, y: 50}}
                              animate={{opacity: 1, y: 0}}
                              transition={{duration: 1}}
                              whileHover={{scale: 1.2}}
                          />
                      </div>
                  </motion.div>
              </div>
          </div>

          {/* Hero Section */}
          <motion.div
              className="relative h-[70vh] flex items-center justify-center bg-cover bg-center"
              style={{backgroundImage: "url('/sustainability.jpg')"}}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{duration: 1}}
          >
              <div className="image-column" style={{textAlign: "center"}}>
                  <img src="/images/line.png" alt="Description of image"
                       style={{maxWidth: "100%", height: "90px", margin: "20px 0"}}/>
                  <img src="/images/line.png" alt="Description of image"
                       style={{maxWidth: "100%", height: "90px", margin: "20px 0"}}/>
              </div>

              <motion.h2
                  className="text-3xl font-semibold mb-6"
                  initial={{y: 50, opacity: 0}}
                  whileInView={{y: 0, opacity: 1}}
                  viewport={{once: true}}
                  transition={{duration: 0.8}}
              >
                  <div style={{textAlign: "center"}}>
                      <h1 className="title is-1">Measure. Learn. Engage & Reduce</h1>
                      <br/>
                      <ImageCarousel/>
                  </div>

              </motion.h2>
              <div className="image-column" style={{textAlign: "center"}}>
                  <img src="/images/line.png" alt="Description of image"
                       style={{maxWidth: "100%", height: "90px", margin: "0px 0"}}/>
                  <img src="/images/line.png" alt="Description of image"
                       style={{maxWidth: "100%", height: "90px", margin: "0px 0"}}/>
              </div>

          </motion.div>

          <div className="items-center">
              <motion.h2
                  className="text-3xl font-semibold mb-6"
                  initial={{y: 50, opacity: 0}}
                  whileInView={{y: 0, opacity: 1}}
                  viewport={{once: true}}
                  transition={{duration: 0.8}}
              >
                  <div style={{textAlign: "center"}}>
                      <br/>
                      <br/>
                      <br/>
                      <h2 className="title is-2 whitespace-nowrap">Empower people to take action for a sustainable
                          future.</h2>
                  </div>
              </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">


              <motion.div className="p-6 bg-gray-800 rounded-xl shadow-lg" whileHover={{scale: 1.05}}
                          style={{textAlign: "center"}}>
                  <FaLeaf className="text-green-400 mx-auto" style={{fontSize: "30px"}}/>
                  <h3 className="title is-3">Environmental</h3>
                  <p className="text-gray-400" style={{fontSize: "20px"}}>
                      Protecting natural resources and reducing waste.
                  </p>
              </motion.div>
              <motion.div className="p-6 bg-gray-800 rounded-xl shadow-lg" whileHover={{scale: 1.05}}
                          style={{textAlign: "center"}}>
                  <FaBalanceScale className="text-blue-400 mx-auto" style={{fontSize: "30px"}}/>
                  <h3 className="title is-3">Social</h3>
                  <p className="text-gray-400" style={{fontSize: "20px"}}>Ensuring equality and well-being for
                      all.</p>
              </motion.div>
              <motion.div className="p-6 bg-gray-800 rounded-xl shadow-lg" whileHover={{scale: 1.05}}
                          style={{textAlign: "center"}}>
                  <FaChartLine className="text-yellow-400 mx-auto" style={{fontSize: "30px"}}/>
                  <h3 className="title is-3">Economic</h3>
                  <p className="text-gray-400" style={{fontSize: "20px"}}>Building stable economies that support the
                      future.</p>
              </motion.div>
          </div>

          <div className="image-column" style={{textAlign: "center"}}>
              <motion.img
                  src="/images/susgoals.png"
                  alt="Description of image"
                  className="image-motion"
                  style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}
                  initial={{opacity: 0, y: 50}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 1}}
                  whileHover={{scale: 1.2}}
              />
          </div>

      </div>
  );
}
