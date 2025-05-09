import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

WebUI.openBrowser('')

WebUI.navigateToUrl('http://localhost:3000/')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Username_input'), 'anna')

WebUI.setEncryptedText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Password_input'), 'aeHFOx8jV/A=')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Image ID 1_button'))

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h3_Calculate your Footprint with Carbon Calculator'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Calculate your Footprint with Carbon Ca_0fcbf2'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Calculate your Footprint with Carbon Ca_6a1ca4'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/div_cool page_cdx-list__item-content'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h3_Share your Experience how to achieve goals'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Share your Experience how to achieve go_7375ce'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h3_Explore Analytics and Posts to gain knowledge'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Explore Analytics and Posts to gain kno_00649e'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h3_Book you place in Sustainability Events'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Explore Analytics and Posts to gain kno_00649e_1'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/h2_Empower people to take action for a sust_290382'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/p_Protecting natural resources and reducing waste'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/div_SocialEnsuring equality and well-being for all'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/div_EconomicBuilding stable economies that _ebbbf2'), 
    0)

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/img_Economic_image-motion'), 
    0)

