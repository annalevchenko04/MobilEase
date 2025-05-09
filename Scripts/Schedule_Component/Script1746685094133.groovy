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

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Username_input'), 'annlev')

WebUI.setEncryptedText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Password_input'), 'aeHFOx8jV/A=')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Image ID 1_button'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Schedule'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_New Event'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), 'Morning running')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), 'let\'s do sport')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '2025-05-08')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_Duration (minutes)'))

WebUI.rightClick(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '60')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/div_PublicPrivate'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '10')

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), 'Gedimino 20')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Save Event'))

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/div_Morning running163000'), 
    0)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Show Event Bookings'))

