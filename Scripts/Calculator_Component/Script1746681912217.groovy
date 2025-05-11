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

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/a_Footprint Calculator'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_WinterSpringSummerFall'), 
    'Spring', true)

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionUSAUKSwedenFranceOther'), 
    'Other', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionApartmentDetach_79c02f'), 
    'Apartment', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '60')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '5')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionNatural GasHeat_2e57be'), 
    'District Heating', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_I dont know'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionYesNo'), 
    'Yes', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionPetrolDieselHyb_106d56'), 
    'Petrol', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_I dont know'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '1')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_I dont know'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionRarelyEvery yea_e7df67'), 
    'Rarely', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.selectOptionByValue(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionVeganVegetarian_b1d045'), 
    'Meat-eater', true)

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_I dont know'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '5')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.setText(findTestObject('Object Repository/Page_Employee Sustainability Page/input_Age_input'), '1')

WebUI.click(findTestObject('Object Repository/Page_Employee Sustainability Page/button_Next'))

WebUI.verifyElementPresent(findTestObject('Object Repository/Page_Employee Sustainability Page/select_Please, choose optionLow (5 hrsweek)_1b6309'), 
    0)

