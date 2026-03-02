import React from "react";
import { motion } from "framer-motion";
import { FaLeaf, FaBalanceScale, FaChartLine } from "react-icons/fa";
import ImageCarousel from "./ImageCarousel";

export default function SustainabilityPage() {
  return (
      <div className="min-h-screen bg-gray-900 text-white">
<div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>

    {/* Hero Section */}
          <motion.div
              className="relative h-[70vh] flex items-center justify-center bg-cover bg-center"
              style={{backgroundImage: "url('/sustainability.jpg')"}}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{duration: 1}}
          >

              <motion.h2
                  className="text-3xl font-semibold mb-6"
                  initial={{y: 50, opacity: 0}}
                  whileInView={{y: 0, opacity: 1}}
                  viewport={{once: true}}
                  transition={{duration: 0.8}}
              >
                  <div style={{textAlign: "center"}}>
                      <ImageCarousel/>
                      <br/>
                      <h1 className="title is-1">MobilEase — One Platform. Every Journey. </h1>
                        <h2 className="title is-3 has-text-centered" style={{ color: "#605fc9", marginBottom: "40px" }}>
                            How are you traveling today?
                          </h2>
                  </div>

              </motion.h2>

          </motion.div>

{/* TRAVEL MODE SELECTION */}
<section className="section" style={{ paddingLeft: "0", paddingRight: "0" }}>



  <div className="columns" style={{ margin: "0" }}>

    {/* BUS CARD */}
    <div className="column is-half">
      <div
        className="box hover-card"
        style={{
          padding: "35px",
          borderRadius: "12px",
          borderTop: "4px solid #605fc9",
          textAlign: "center"
        }}
      >
        <figure style={{ marginBottom: "20px" }}>
          <img
            src="/images/p6.png"
            alt="Bus"
            style={{
              width: "140px",
              height: "140px",
              objectFit: "contain"
            }}
          />
        </figure>

<h3 className="title is-4">Bus Travel</h3>
<p
  className="is-size-6"
  style={{ maxWidth: "300px", margin: "0 auto" }}
>
  Discover domestic routes with flexible schedules and instant ticket booking.
</p>

        <div style={{ marginTop: "12px" }}>
          <a
            href={`http://localhost:3000/explore`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#605fc9",
              fontWeight: "600",
              textDecoration: "none",
              cursor: "pointer"
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>➜</span>
          </a>
        </div>
      </div>
    </div>

    {/* CAR CARD */}
    <div className="column is-half">
      <div
        className="box hover-card"
        style={{
          padding: "35px",
          borderRadius: "12px",
          borderTop: "4px solid #605fc9",
          textAlign: "center"
        }}
      >
        <figure style={{ marginBottom: "20px" }}>
          <img
            src="/images/img_4.png"
            alt="Car Rental"
            style={{
              width: "140px",
              height: "140px",
              objectFit: "contain"
            }}
          />
        </figure>

        <h3 className="title is-4">Car Rental</h3>
        <p className="is-size-6" style={{ maxWidth: "300px", margin: "0 auto" }}>
          Rent a vehicle for personal travel, business trips, or weekend getaways.
        </p>
           <div style={{ marginTop: "12px" }}>
          <a
            href={`http://localhost:3000/explorerent`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#605fc9",
              fontWeight: "600",
              textDecoration: "none",
              cursor: "pointer"
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>➜</span>
          </a>
        </div>
      </div>
    </div>

  </div>
</section>
          {/*/!* Info Section *!/*/}
          {/*<div className="py-12 px-6 md:px-20 text-center">*/}
          {/*    <div className="items-center">*/}
          {/*        <motion.div className="grid md:grid-cols-2 gap-8 items-center">*/}
          {/*            /!* Left Column: Text Block *!/*/}

          {/*            <motion.div*/}
          {/*                className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"*/}
          {/*                whileHover={{scale: 1.05}}*/}
          {/*            >*/}
          {/*                <div className="has-text-centered">*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">*/}
          {/*                        Calculate your Footprint with Carbon Calculator*/}
          {/*                    </h3>*/}
          {/*                    <img*/}
          {/*                        src="/images/arrow.png"*/}
          {/*                        alt="Description of image"*/}
          {/*                        className="is-fullwidth"*/}
          {/*                        style={{maxWidth: "80%", height: "150px", margin: "20px 0", objectFit: "contain"}}*/}
          {/*                    />*/}
          {/*                </div>*/}
          {/*            </motion.div>*/}

          {/*            /!* Right Column: Image *!/*/}
          {/*            <div className="image-column">*/}
          {/*                <motion.img*/}
          {/*                    src="/images/p6.png"*/}
          {/*                    alt="Description of image"*/}
          {/*                    className="image-motion"*/}
          {/*                    style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}*/}
          {/*                    initial={{opacity: 0, y: 50}}*/}
          {/*                    animate={{opacity: 1, y: 0}}*/}
          {/*                    transition={{duration: 1}}*/}
          {/*                    whileHover={{scale: 1.2}}*/}
          {/*                />*/}
          {/*            </div>*/}
          {/*        </motion.div>*/}
          {/*    </div>*/}

          {/*    <div className="items-center">*/}
          {/*        <motion.div className="grid md:grid-cols-2 gap-8 items-center">*/}
          {/*            /!* Left Column: Text Block *!/*/}
          {/*            <div className="image-column">*/}
          {/*                <motion.img*/}
          {/*                    src="/images/img_4.png"*/}
          {/*                    alt="Description of image"*/}
          {/*                    className="image-motion"*/}
          {/*                    style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}*/}
          {/*                    initial={{opacity: 0, y: 50}}*/}
          {/*                    animate={{opacity: 1, y: 0}}*/}
          {/*                    transition={{duration: 1}}*/}
          {/*                    whileHover={{scale: 1.2}}*/}
          {/*                />*/}
          {/*            </div>*/}

          {/*            /!* Right Column: Image *!/*/}
          {/*            <motion.div className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"*/}
          {/*                        whileHover={{scale: 1.05}}>*/}
          {/*                <div style={{textAlign: "center"}}>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">*/}
          {/*                        Suggest and Vote for Monthly Challenge </h3>*/}
          {/*                    <img*/}
          {/*                        src="/images/arrow2.png"*/}
          {/*                        alt="Description of image"*/}
          {/*                        className="is-fullwidth"*/}
          {/*                        style={{maxWidth: "80%", height: "200px", margin: "20px 0", objectFit: "contain"}}*/}
          {/*                    />*/}
          {/*                </div>*/}
          {/*            </motion.div>*/}
          {/*        </motion.div>*/}
          {/*    </div>*/}
          {/*    <div className="items-center">*/}
          {/*        <motion.div className="grid md:grid-cols-2 gap-8 items-center">*/}
          {/*            /!* Left Column: Text Block *!/*/}
          {/*            <motion.div className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"*/}
          {/*                        whileHover={{scale: 1.05}}>*/}
          {/*                <div style={{textAlign: "center"}}>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">*/}
          {/*                        Explore Analytics and Posts to gain knowledge</h3>*/}
          {/*                    <img*/}
          {/*                        src="/images/arrow.png"*/}
          {/*                        alt="Description of image"*/}
          {/*                        className="is-fullwidth"*/}
          {/*                        style={{maxWidth: "80%", height: "150px", margin: "20px 0", objectFit: "contain"}}*/}
          {/*                    />*/}
          {/*                </div>*/}
          {/*            </motion.div>*/}

          {/*            /!* Right Column: Image *!/*/}
          {/*            <div className="image-column">*/}
          {/*                <motion.img*/}
          {/*                    src="/images/img_1.png"*/}
          {/*                    alt="Description of image"*/}
          {/*                    className="image-motion"*/}
          {/*                    style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}*/}
          {/*                    initial={{opacity: 0, y: 50}}*/}
          {/*                    animate={{opacity: 1, y: 0}}*/}
          {/*                    transition={{duration: 1}}*/}
          {/*                    whileHover={{scale: 1.2}}*/}
          {/*                />*/}
          {/*            </div>*/}
          {/*        </motion.div>*/}
          {/*    </div>*/}

          {/*    <div className="items-center">*/}
          {/*        <motion.div className="grid md:grid-cols-2 gap-8 items-center">*/}
          {/*            /!* Left Column: Text Block *!/*/}
          {/*            <div className="image-column">*/}
          {/*                <motion.img*/}
          {/*                    src="/images/img_3.png"*/}
          {/*                    alt="Description of image"*/}
          {/*                    className="image-motion"*/}
          {/*                    style={{maxWidth: "80%", height: "auto", margin: "20px 0"}}*/}
          {/*                    initial={{opacity: 0, y: 50}}*/}
          {/*                    animate={{opacity: 1, y: 0}}*/}
          {/*                    transition={{duration: 1}}*/}
          {/*                    whileHover={{scale: 1.2}}*/}
          {/*                />*/}
          {/*            </div>*/}

          {/*            /!* Right Column: Image *!/*/}
          {/*            <motion.div className="p-6 bg-gray-700 rounded-xl shadow-lg w-full max-w-4xl mx-auto"*/}
          {/*                        whileHover={{scale: 1.05}}>*/}
          {/*                <div style={{textAlign: "center"}}>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <br/>*/}
          {/*                    <h3 className="title is-5 is-size-4-mobile is-size-3-tablet is-size-2-desktop">*/}
          {/*                        Book you place in Sustainability Events </h3>*/}
          {/*                </div>*/}
          {/*            </motion.div>*/}
          {/*        </motion.div>*/}
          {/*    </div>*/}
          {/*</div>*/}
 {/* FEATURES GRID */}
      <section className="section" style={{ background: "#f9f9ff" }}>
        <div className="container">
          <h2 className="title is-3 has-text-centered" style={{ color: "#605fc9" }}>
            What You Can Do
          </h2>

          <div className="columns" style={{ marginTop: "40px" }}>

              <div className="column">
              <div className="box">
                <h3 className="title is-5">💳 Secure Payments</h3>
                <p>Stripe‑powered secure payments.   </p>
              </div>
            </div>

            <div className="column">
              <div className="box">
                <h3 className="title is-5">🚍 Book Bus Tickets</h3>
                <p>Search routes, choose seats, and get QR‑code tickets.</p>
              </div>
            </div>

            <div className="column">
              <div className="box">
                <h3 className="title is-5">🚗 Rent a Car</h3>
                <p>Browse vehicles and receive digital agreements.</p>
              </div>
            </div>


            <div className="column">
              <div className="box">
                <h3 className="title is-5">📊 License Verification</h3>
                <p>Verify our license and rent a car freely</p>
              </div>
            </div>
          </div>
        </div>
      </section>



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
                      <h2 className="title is-2 whitespace-nowrap">From Bus Seats to Car Keys.</h2>
                  </div>
              </motion.h2>
          </div>

                {/* VALUE PROPOSITION SECTION */}
      <section className="section">
        <div className="container has-text-centered">

          <div className="columns is-centered" style={{ marginTop: "2px" }}>
            <div className="column is-3">
                <div className="box hover-card" style={{ borderTop: "4px solid #605fc9" }}>
                <span className="icon is-large">
                  <i className="fas fa-bus fa-2x" style={{ color: "#605fc9" }}></i>
                </span>
                <h3 className="title is-5">Unified Transport</h3>
                <p>Book bus tickets or rent a car — all from one platform.</p>
              </div>
            </div>

            <div className="column is-3">
                <div className="box hover-card" style={{ borderTop: "4px solid #605fc9" }}>
                <span className="icon is-large">
                  <i className="fas fa-lock fa-2x" style={{ color: "#605fc9" }}></i>
                </span>
                <h3 className="title is-5">Secure & Verified</h3>
                <p>Identity checks, digital contracts, and safe Stripe payments.</p>
              </div>
            </div>

            <div className="column is-3">
                <div className="box hover-card" style={{ borderTop: "4px solid #605fc9" }}>
                <span className="icon is-large">
                  <i className="fas fa-chart-line fa-2x" style={{ color: "#605fc9" }}></i>
                </span>
                <h3 className="title is-5">Smart Mobility</h3>
                <p>Dynamic pricing, QR check‑ins, analytics, and notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      </div>
    </div>
  );
}
